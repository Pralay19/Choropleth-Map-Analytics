# Choropleth Map Analytics (CMA)

![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Choropleth Map Analytics (CMA) is an end-to-end solution for reverse-engineering choropleth map images. These maps visually depict data through color gradation across various geographical regions and are commonly used in demographics, economics, and environmental studies. The system processes such images by extracting embedded data, making it more accessible for analysis.

The CMA system features a browser-based GUI that unifies a six-step workflow into a seamless, cohesive experience:

1. **Image Classification**: Categorizes input map images as choropleth maps
2. **Chart Component Extraction**: Identifies and isolates components like legends
3. **Text Extraction**: Extracts title, legend text, and other annotations
4. **Color Legend Analysis**: Maps color to data based on the extracted legend
5. **State/Political Unit Segmentation**: Segments the map into geographical units
6. **Color-to-Data Mapping**: Maps extracted colors to their respective data values

## Features

- **Unified Workflow**: Processes choropleth maps end-to-end without manual intervention between steps
- **Browser-Based GUI**: Access the system through a modern web interface without specialized setup
- **Map Reconstruction**: Visualize extracted data through reconstructed maps using PlotlyJS
- **AI-Generated Summaries**: Get context-aware summaries of map data using Groq API
- **Multiple Visualization Options**: Select color palettes, generate individual plots, or compare multiple maps

## Demo

[View Demo Video](https://youtu.be/jqbbaFvNklg)

## Screenshots

![CMA Interface](https://res.cloudinary.com/dygma3ujd/image/upload/fl_preserve_transparency/v1747261705/CMA/Screenshots/1_cskqtz.jpg)

![CMA Interface](https://res.cloudinary.com/dygma3ujd/image/upload/fl_preserve_transparency/v1747261706/CMA/Screenshots/2_fyeqrt.jpg)

[More](https://drive.google.com/drive/folders/1NH4-Y_HvYRYSaThsxwhcwYOUD0wFgZCV?usp=sharing)

## Tech Stack

### Frontend
- React.js
- Plotly.js for visualization
- PrimeReact for UI components
- Styled Components

### Backend
- Flask
- Gunicorn
- Machine Learning Models:
  - ResNet-50 for image classification
  - Detectron2 for object detection and segmentation
  - PaddleOCR for text extraction
- TensorFlow, PyTorch, OpenCV

### AI Services
- Groq API (Model: deepseek-r1-distill-llama-70b) for generating summaries

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/Pralay19/Choropleth-Map-Analytics
cd choropleth-map-analytics

# Setup Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Create .env file by copying .env.sample and put appropriate values

# Start the backend server
python app.py
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. Access the web interface at `http://localhost:5173`
2. Log in using Google authentication
3. Upload a choropleth map image
4. The system will process the image through the six-step workflow
5. View the extracted data, reconstructed map, and AI-generated summary
6. Export results as needed

## Deployment

The application can be deployed on a server with the following steps:

```bash
# Build the frontend
cd frontend
npm run build

# Start the backend with Gunicorn
cd ../backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Future Work

- Assigning a domain name for consistent public access
- Conducting user surveys to gather feedback on data quality and AI summaries
- Improving small state detection in the segmentation process
- Enhancing error handling for edge cases

## Contributors

- Pralay Dutta Saw
- Rajan Khade

## References

1. P. Nileshbhai Butani, J. Sreevalsan-Nair, and N. Kamat, "CMA: An End-to-End System for Reverse Engineering Choropleth Map Images," IEEE Geoscience and Remote Sensing Letters, vol. 21, pp. 1–5, 2024, Art no. 8003305, doi: 10.1109/LGRS.2024.3444600.
2. [Detectron2 Documentation](https://detectron2.readthedocs.io/)
3. [PaddleOCR Documentation](https://github.com/PaddlePaddle/PaddleOCR)
4. [Plotly Documentation](https://plotly.com/javascript/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
