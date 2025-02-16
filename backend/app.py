#------------------------------------------------------------------------------------------
from flask import Flask, request, jsonify, Response, stream_with_context
from flask import send_file, abort
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from numpy import asarray
import pandas as pd
import os
import sys
import shutil
import distutils.core
import time
import json
import cv2
import csv
from werkzeug.utils import secure_filename
from tensorflow.keras.preprocessing.image import load_img

# Detectron2
import torch, detectron2
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.data import MetadataCatalog, DatasetCatalog
from skimage.measure import label, regionprops

# OCR
from paddleocr import PaddleOCR

app = Flask(__name__)
CORS(app)

# RESNET Model
MODEL_PATH_RESNET = "model/Trained_Models/Colab/resnet50.h5"
model_resnet = tf.keras.models.load_model(MODEL_PATH_RESNET)

# Annotation detectron2 model
MODEL_PATH_ANNOTATION = "model/Trained_Models/Colab/annotation/detectron2_annotation.pth"
cfg1 = get_cfg()
cfg1.merge_from_file("model/Trained_Models/Colab/annotation/config.yaml")
cfg1.MODEL.WEIGHTS = MODEL_PATH_ANNOTATION
cfg1.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # confidence threshold
cfg1.MODEL.DEVICE = "cpu"

annotation_dataset_name = "annotation_dataset_train"
cfg1.DATASETS.TRAIN = (annotation_dataset_name,)

# class_names = ["title", "legend"]
# MetadataCatalog.get(cfg1.DATASETS.TRAIN[0]).thing_classes = class_names
# train_metadata_annotation = MetadataCatalog.get(cfg1.DATASETS.TRAIN[0])
MetadataCatalog.get(annotation_dataset_name).thing_classes = ["title", "legend"]
train_metadata_annotation = MetadataCatalog.get(annotation_dataset_name)

model_annotation = DefaultPredictor(cfg1) #Detectron2 model for the segmentation of the components



# State Segmentation detectron2 model
MODEL_PATH_STATES = "model/Trained_Models/Colab/detectron2.pth"
cfg2 = get_cfg()
cfg2.merge_from_file("model/Trained_Models/Colab/config.yaml")
cfg2.MODEL.WEIGHTS = MODEL_PATH_STATES
cfg2.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # confidence threshold
cfg2.MODEL.DEVICE = "cpu"

states_dataset_name = "states_dataset_train"
cfg2.DATASETS.TRAIN = (states_dataset_name,)

class_names = ["Washington", "Idaho", "Montana", "North Dakota", "South Dakota", "Minnesota", "Iowa", "Wisconsin", "Illinois", "Indiana", "Michigan", "Ohio", "Pennsylvania", "New York", "Vermont", "New Hampshire", "Maine", "Massachusetts", "Rhode Island", "Connecticut", "New Jersey", "Delaware", "Maryland", "West Virginia", "Virginia", "Kentucky", "Tennessee", "North Carolina", "South Carolina", "Georgia", "Alabama", "Mississippi", "Florida", "Louisiana", "Arkansas", "Oklahoma", "Texas", "New Mexico", "Colorado", "Wyoming", "Nebraska", "Utah", "Arizona", "Nevada", "California", "Oregon", "Alaska", "Hawaii", "Kansas", "Missouri"]

MetadataCatalog.get(states_dataset_name).thing_classes = class_names
train_metadata_states = MetadataCatalog.get(states_dataset_name)

model_states = DefaultPredictor(cfg2) #Detectron2 model for segmentation of states


# OCR model
ocr_model = PaddleOCR(lang='en')



# Folders:
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

OUTPUT_FOLDER = "outputs"
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Clear the Folders
def clear_folder_contents(folder_path):   
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)

            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print(f"Error clearing {file_path}: {e}")


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "System is Online", "status": "Success"})

# For RESNET:
def preprocess_image(filepath):
    img = load_img(filepath, target_size=(224, 224))
    img = np.asarray(img)/255
    img_array = np.expand_dims(img, axis=0)
    return img_array




# For ANNOTATION model->batch processing of the images
def process_images(input_dir):
    data = []
    for image_filename in os.listdir(input_dir):
        image_path = os.path.join(input_dir, image_filename)
        new_im = cv2.imread(image_path)
        outputs = model_annotation(new_im)

        mask = outputs["instances"].pred_masks.to("cpu").numpy().astype(bool)
        class_labels = outputs["instances"].pred_classes.to("cpu").numpy()

        labeled_mask = label(mask)
        props = regionprops(labeled_mask)

        for i, prop in enumerate(props):
            bounding_box = tuple(prop.bbox)
            class_name = train_metadata_annotation.thing_classes[class_labels[i]] if i < len(class_labels) else 'Unknown'
            data.append((image_filename, class_name, bounding_box))
    return data

def format_bounding_box(bbox):
    return '' if not bbox else f'({bbox[1]},{bbox[2]},{bbox[4]},{bbox[5]})'

def generate_csv(data, output_path):
    coordinates_dict = {}
    for filename, class_name, bounding_box in data:
        if filename not in coordinates_dict:
            coordinates_dict[filename] = {}
        coordinates_dict[filename][class_name] = bounding_box

    df = pd.DataFrame({
        'file name': coordinates_dict.keys(),
        'legend bounding box': [format_bounding_box(coordinates_dict[f].get('legend', ())) for f in coordinates_dict],
        'title bounding box': [format_bounding_box(coordinates_dict[f].get('title', ())) for f in coordinates_dict]
    })

    df.to_csv(output_path, index=False)





uploaded_files = []

@app.route("/predict", methods=["POST"])
def predict():
    global uploaded_files
    uploaded_files.clear()

    if "files" not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist("files")
    if not files or all(file.filename == "" for file in files):
        return jsonify({"error": "No files selected"}), 400

    for file in files:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        uploaded_files.append(filepath)

    print("Files uploaded successfully:", uploaded_files)  # Debugging
    return jsonify({"message": "Files uploaded successfully", "status": "success"}), 200

@app.route("/predict-stream", methods=["GET"])
def predict_stream():
    def generate_progress():
        global uploaded_files
        if not uploaded_files:
            yield f"data: {json.dumps({'error': 'No files uploaded'})}\n\n"
            yield ""
            return

        progress_updates = [
            {"step": 1, "label": "Upload Images", "status": "completed"},
            {"step": 2, "label": "Classification of Map Legend type(Discrete/Continous)", "status": "processing"},
            {"step": 3, "label": "Segmentation of Map Components", "status": "processing"},
            {"step": 4, "label": "Segmentation of State Boundaries", "status": "processing"},
            {"step": 5, "label": "OCR Text Data Extraction", "status": "processing"},
            {"step": 6, "label": "Color-to-Data Mapping", "status": "processing"},
            {"step": 7, "label": "Download Result", "status": "pending"},
        ]

        yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        yield ""

        results = []
        # print("\nHELLO I AM INSIDE\n")
        # for filepath in uploaded_files:
        #     try:
        #         print(f"Processing file: {filepath}")
        #         sys.stdout.flush()

        #         #Resnet Model
        #         img = preprocess_image(filepath)
        #         prediction_resnet = model_resnet.predict(img)
        #         results.append({"file": os.path.basename(filepath), "Predictions_resnet": prediction_resnet.tolist()})


        #         #Annotation Model
        #         img=cv2.imread(filepath)
        #         prediction_annotation = model_annotation(img)
        #         results.append({"file": os.path.basename(filepath), "Predictions_annotation": prediction_annotation})
        #         print("\n")
        #         print(prediction_annotation)
        #         print(results)
        #         progress_updates[1]["status"] = "completed"
        #         progress_updates[2]["status"] = "completed"
        #         yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        #         print("\n")
        #     except Exception as e:
        #         print(f"Error processing {filepath}: {str(e)}")
        #         sys.stdout.flush()
        #         results.append({"file": os.path.basename(filepath), "error": str(e)})

        # RESNET MODEL BATCH PROCESSING
        csv_file = os.path.join(OUTPUT_FOLDER, "classification.csv")
        with open(csv_file, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["file name", "Type"])

            for filename in os.listdir(UPLOAD_FOLDER):
                if filename.endswith('.png'):
                    path = os.path.join(UPLOAD_FOLDER, filename)
                    img = preprocess_image(path)
                    prediction_resnet = model_resnet.predict(img)
                    img_type = "continuous" if prediction_resnet[0][0] > 0.5 else "discrete"
                    writer.writerow([filename, img_type])
        
        progress_updates[1]["status"] = "completed"
        yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        print(f"\nPredictions saved to {csv_file}")
#-----------------------------------------------------------------------------------------------

        # ANNOTATION DETECTRON2 MODEL BATCH PROCESSING
        output_csv_path = os.path.join(OUTPUT_FOLDER, "output_objects.csv")
        data_annotation = process_images(UPLOAD_FOLDER)
        generate_csv(data_annotation, output_csv_path)
        progress_updates[2]["status"] = "completed"
        yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        print("Processed output saved to CSV.")
#-----------------------------------------------------------------------------------------------
        # DETECTRON2 FOR SEGMENTATION OF STATES
        output_csv_path = os.path.join(OUTPUT_FOLDER, "output_objects_state_segmentation.csv")

        with open(output_csv_path, 'w', newline='') as csvfile:
            csvwriter = csv.writer(csvfile)
            csvwriter.writerow(["File Name", "Class Name", "Object Number", "Centroid", "BoundingBox", "RGB Color"])

            for image_filename in os.listdir(UPLOAD_FOLDER):
                image_path = os.path.join(UPLOAD_FOLDER, image_filename)
                new_im = cv2.imread(image_path)

                outputs = model_states(new_im)

                mask = outputs["instances"].pred_masks.to("cpu").numpy().astype(bool)
                class_labels = outputs["instances"].pred_classes.to("cpu").numpy()
                labeled_mask = label(mask)
                props = regionprops(labeled_mask)

                for i, prop in enumerate(props):
                    object_number = i + 1
                    centroid = prop.centroid
                    bounding_box = prop.bbox[1:3] + prop.bbox[4:]

                    n = int(centroid[0])

                    if i < len(class_labels):
                        class_label = class_labels[n]
                        class_name = train_metadata_states.thing_classes[class_label]
                    else:
                        class_name = 'Unknown'

                    # Extract RGB color value from the centroid position
                    centroid_x, centroid_y = int(centroid[2]), int(centroid[1])
                    rgb_color = tuple(new_im[centroid_y, centroid_x])[::-1]

                    csvwriter.writerow([image_filename, class_name, object_number, centroid, bounding_box, rgb_color])

        progress_updates[3]["status"] = "completed"
        yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        print("\nObject-level information saved to CSV file.")
        print("\nSegmentation of all images completed.")
#-----------------------------------------------------------------------------------------------
        # OCR MODEL FOR TEXT EXTRACTION
        df1 = pd.read_csv("outputs/classification.csv")
        df2 = pd.read_csv("outputs/output_objects.csv")
        annotations_df = pd.merge(df2, df1, on="file name")
        img_path = "uploads"
        data=[]
        for row in annotations_df.itertuples():
            file_name = row[1]
            map_type = row[4]
            title_bounding_box = row[3]
            legend_bounding_box = row[2]
            data.append((file_name, map_type, title_bounding_box, legend_bounding_box))
        
        def convert_to_doubles(low, upper_bound):
            low=lower_bound.replace(",", "")
            up=upper_bound.replace(",", "")

            if low and not low[-1].isdigit():
                units = low[-1]
                low = float(low[:-1])
            else:
                units = 'u'
                low = float(low)

            if up and not up[-1].isdigit():
                units = up[-1]
                up = float(up[:-1])
            else:
                units = 'u'
                up = float(up)

            return low, up, units

        def num_there(s):
            return any(i.isdigit() for i in s)

        def only_num(s):
            return s.isnumeric()

        def contains_hyphen(text_):
            return '-' in text_

        def extract_numbers(test_string):
            numeric_string = ''.join(char for char in test_string if char.isdigit() or char == ',')
            words = numeric_string.split(',')
            numbers = [int(i) for i in words]
            return numbers

        
        complete_data = []

        for ele in data:
            file_name = ele[0]

            map_type = ele[1]
            title_bounding_box = ele[2]
            legend_bounding_box = ele[3]

            values = extract_numbers(title_bounding_box)

            imgPath = f"uploads/{file_name}"
            image = cv2.imread(imgPath)

            y, x, h, w = values

            cropped_img = image[y:y+h, x:x+w]
            numpydata = asarray(cropped_img)

            result = ocr_model.ocr(numpydata, cls=False)
            map_title = result[0][0][1][0]


            numerical_info = []
            values = extract_numbers(legend_bounding_box)
            y, x, h, w = values

            cropped_img = image[y:y+h, x:x+w]
            numpydata = asarray(cropped_img)
            image = cropped_img

            result = ocr_model.ocr(numpydata, cls=False)

            for line in result:
                for word in line:
                    text = word[1][0]

                    x, y, w, h = word[0][0][0], word[0][0][1], abs(word[0][0][0]-word[0][1][0]), abs(word[0][1][1]-word[0][2][1])

                    x1 = int(x)
                    y1 = int(y+h//2)
                    x2 = int(x)
                    y2 = int(y+h//2-1)

                    while all(image[y1, x1]==image[y2, x2]):
                        x2-=1
                    x3 = x2
                    while all(image[y1, x1]==image[y2, x3]):
                        x3-=1

                    x2 = (x2+x3)//2
                    color = image[y2,x2]

                    blue, green, red = color
                    numerical_info += [text] + [red, green, blue]

            i=0
            value_id = 0
            while i<len(numerical_info):
                value_id += 1

                if numerical_info[i]!="N/A" and numerical_info[i]!="-" and any(char.isdigit() for char in numerical_info[i]):     # modified code from original
                    values = numerical_info[i].split("-")

                    if len(values)>1:
                        lower_bound = values[0]
                        upper_bound = values[1]
                    else:
                        lower_bound = values[0]
                        upper_bound = values[0]
                    converted_lower_bound, converted_upper_bound, units = convert_to_doubles(lower_bound, upper_bound)
                    info = [file_name, map_type, map_title, numerical_info[i+1], numerical_info[i+2], numerical_info[i+3], (converted_lower_bound+converted_upper_bound)/2, units]

                else:
                    values = "N/A"
                    info = [file_name, map_type, map_title, numerical_info[i+1], numerical_info[i+2], numerical_info[i+3], values, ""]

                map_name = img_path.split("/")[-1].split(".")[0]
                info = [map_name] + info
                complete_data += [info]
                i+=4
        
        
        output_df = pd.DataFrame(complete_data)
        df = output_df[output_df[7] != 'N/A']
        
        combined_column = df.apply(lambda row: f"({row[4]}, {row[5]}, {row[6]})", axis=1)
        df['RGB color'] = combined_column
        df.drop([4, 5, 6], axis=1, inplace=True)
        df.drop([0], axis=1, inplace=True)
        new_column_names = {
        1: 'file_name',
        2: 'map_type',
        3: 'map_title',
        7: 'value',
        8: 'unit'
        }
        df = df.rename(columns=new_column_names)
        df.to_csv("outputs/OCR_output.csv", index = False)
        
        progress_updates[4]["status"] = "completed"
        yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        print("OCR output is saved.")
#------------------------------------------------------------------------------------------------
        # Color-to-Data Mapping
        ocr_df = pd.read_csv("outputs/OCR_output.csv")
        seg_df = pd.read_csv("outputs/output_objects_state_segmentation.csv")  
        output_file_path = "outputs/Color_To_Data_Mapping.csv"  

        def getDataForFilename(output_data, filename):
            return [tuple for tuple in output_data if tuple[0] == filename]

        def getUniqueFilenames(ocr_df):
            return ocr_df['file_name'].unique().tolist() 

        def getMapTitleDictionary(ocr_df, filenames_list):
            map_dict = {}
            for filename in filenames_list:
                filtered_rows = ocr_df[ocr_df['file_name'] == filename]
                row = filtered_rows.iloc[0]
                map_dict[filename] = row['map_title']

            return map_dict   

        data_a = []
        data_b = []

        for row in seg_df.itertuples():
            file_name = row[1]
            state = row[2]
            color_str = row[6]
            color = tuple(int(x) for x in color_str.strip('()').split(', '))
            data_a.append((file_name, state, color))
        
        for row in ocr_df.itertuples():
            file_name = row[1]
            map_type = row[2]
            map_title = row[3]
            color_str = row[6]
            color = tuple(int(x) for x in color_str.strip('()').split(', '))
            value = row[4]
            if value != "'N/A'":
                average_value = float(value)
            else:
                average_value = 0
            unit = row[5]
            data_b.append((file_name, map_type, map_title, average_value, unit, color))
    
        output_data = []
        for file_name, state, state_color in data_a:
            numerical_data = []
            for file, map_type, map_title, average_value, unit, color in data_b:
                if file_name == file:
                    numerical_data.append((map_title, map_type, color, average_value, unit))
            if numerical_data:
                mapType = numerical_data[0][1]
                if mapType == "discrete":
                    min_distance = float('inf')
                    assigned_value = None
                    assigned_unit = None
                    for map_title, map_type, color, average_value, unit in numerical_data:
                        # calculating Euclidean distance
                        distance = sum((c1 - c2) ** 2 for c1, c2 in zip(state_color, color))
                        if distance < min_distance:
                            min_distance = distance
                            assigned_value = average_value
                            assigned_unit = unit
                    output_data.append((file_name, state, assigned_value, assigned_unit))
                elif mapType == "continuous":
                    assigned_value = 0
                    assigned_unit = numerical_data[0][4]
                    for i in range(len(numerical_data) - 1):
                        delta = 0
                        if i == 0:
                            delta = 1
                        elif i == len(numerical_data) - 2:
                            delta = -0.5

                        colour_1, value_1 = numerical_data[i][2], numerical_data[i][3]
                        colour_2, value_2 = numerical_data[i + 1][2], numerical_data[i + 1][3]

                        A = []
                        for sc, c1, c2 in zip(state_color, colour_1, colour_2):
                            if c1 == c2:
                                A.append(0)
                            else:
                                A.append((sc - c2) / (c1 - c2))

                        non_zero_A = [a for a in A if a != 0]
                        if non_zero_A:
                            A = sum(non_zero_A) / len(non_zero_A)
                        else:
                            A = 0

                        if (0 + delta) <= A and A <= (1 + delta):
                            assigned_value = A * (value_1 - value_2) + value_2
                    output_data.append((file_name, state, assigned_value, assigned_unit))
        
        file_list = getUniqueFilenames(ocr_df)
        map_titles = getMapTitleDictionary(ocr_df, file_list)

        df = pd.DataFrame(columns=['State_Name'])
        df['State_Name'] = list({state for _, state, _, _ in output_data})

        for filename in file_list:
            dataReqd = getDataForFilename(output_data, filename)
            # map_title = map_titles[filename]
            map_title = f"{map_titles[filename]} ({dataReqd[0][3]})"
            df[map_title] = 0.0

            for filename, state, assigned_value, assigned_unit in dataReqd:
                df.loc[df['State_Name'] == state, map_title] = assigned_value
        
        
        df = df.drop_duplicates()
        for col in df.columns[1:]:
            median_val = df[col].replace(0, pd.NA).median()
            df[col] = df[col].replace(0, median_val)

        df.to_csv(output_file_path, index=False)

        progress_updates[5]["status"] = "completed"
        progress_updates[6]["status"] = "completed"
        yield f"data: {json.dumps({'progress': progress_updates})}\n\n"
        print("\nColor-to-data mapping completed")
#------------------------------------------------------------------------------------------------
        results = df.to_dict(orient='records')

        final_data = json.dumps({
            "Results": results,
            "progress": progress_updates,
            "status": "success",
        })


        

        yield f"data: {final_data}\n\n"
        sys.stdout.flush()

    return Response(stream_with_context(generate_progress()), mimetype="text/event-stream")

@app.route('/download', methods=['GET'])
def download_results():
    file_path = os.path.join(OUTPUT_FOLDER, "Color_To_Data_Mapping.csv")
    if os.path.exists(file_path):
        try:
            response = send_file(file_path, as_attachment=True, download_name='results.csv')
            # Clearing Folder contents of the session
            clear_folder_contents(OUTPUT_FOLDER)
            clear_folder_contents(UPLOAD_FOLDER)
            return response
        except Exception as e:
            abort(500, description=f"Error sending file: {str(e)}")
    else:
        abort(404, description="File not found")

if __name__ == "__main__":
    app.run(debug=True,use_reloader=False)


