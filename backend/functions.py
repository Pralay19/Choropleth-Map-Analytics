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
#-------importing functions file for various functions
from functions import *
#-------Detectron2
import torch, detectron2
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.data import MetadataCatalog, DatasetCatalog
from skimage.measure import label, regionprops



# Annotation detectron2 model
MODEL_PATH_ANNOTATION = "model/Trained_Models/Colab/annotation/detectron2_annotation.pth"
cfg1 = get_cfg()
cfg1.merge_from_file("model/Trained_Models/Colab/annotation/config.yaml")
cfg1.MODEL.WEIGHTS = MODEL_PATH_ANNOTATION
cfg1.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # confidence threshold
cfg1.MODEL.DEVICE = "cpu"

annotation_dataset_name = "annotation_dataset_train"
cfg1.DATASETS.TRAIN = (annotation_dataset_name,)

MetadataCatalog.get(annotation_dataset_name).thing_classes = ["title", "legend"]
train_metadata_annotation = MetadataCatalog.get(annotation_dataset_name)

model_annotation = DefaultPredictor(cfg1) #Detectron2 model for the segmentation of the components


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



# @app.route("/", methods=["GET"])
# def home():
#     return jsonify({"message": "System is Online", "status": "Success"})

# For RESNET:
def preprocess_image(filepath):
    img = load_img(filepath, target_size=(224, 224))
    img = np.asarray(img)/255
    img_array = np.expand_dims(img, axis=0)
    return img_array

def delete_path(path):
    if os.path.exists(path):
        try:
            if os.path.isfile(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
            print(f"Deleted: {path}")
            return True
        except Exception as e:
            print(f"Error deleting {path}: {e}")
            return False
    else:
        print(f"Path does not exist: {path}")
        return False


# For ANNOTATION model->batch processing of the images
def process_images(file_paths):
    data = []
    # file_paths is now assumed to be a list of file paths.
    for file_path in file_paths:
        image_filename = os.path.basename(file_path)
        new_im = cv2.imread(file_path)
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
