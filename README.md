# Clean and Transform Data

This project provides a platform for cleaning and transforming CSV data, leveraging a FastAPI backend for processing and a React frontend for user interaction. Users can upload CSV files, configure cleaning options, preview the transformed data, and download the cleaned results. User authentication is implemented to ensure data privacy and security.

## Features and Functionality

*   **User Authentication:** Secure registration and login using bcrypt and JWT.
*   **CSV Upload and Processing:** Upload CSV files and configure cleaning and transformation options.
*   **Data Cleaning:**
    *   Duplicate removal.
    *   Handling of missing values.
    *   Outlier detection and removal.
    *   Data standardization (scaling numerical columns).
*   **Data Transformation Preview:** View a sample of the transformed data.
*   **Statistics Generation:** Provides descriptive statistics for both numerical and categorical columns.
*   **Data Download:** Download the cleaned CSV file.
*   **Processing History:** View a history of uploaded files and their processing status.
*   **Responsive UI:** User-friendly and responsive interface using React and Radix UI components.

## Technology Stack

*   **Frontend:**
    *   React
    *   TypeScript
    *   Radix UI for accessible components
    *   Tailwind CSS for styling
    *   Axios for API communication
    *   react-router-dom for routing
    *   react-dropzone for file uploads
    *   react-hot-toast for notifications
    *   lucide-react for icons
    *   papaparse for parsing CSV files
    *   embla-carousel-react for carousels
    *   @tanstack/react-query for data fetching and caching
    *   Radix UI libraries:
        *   `@radix-ui/react-accordion`
        *   `@radix-ui/react-alert-dialog`
        *   `@radix-ui/react-aspect-ratio`
        *   `@radix-ui/react-avatar`
        *   `@radix-ui/react-checkbox`
        *   `@radix-ui/react-collapsible`
        *   `@radix-ui/react-context-menu`
        *   `@radix-ui/react-dialog`
        *   `@radix-ui/react-dropdown-menu`
        *   `@radix-ui/react-label`
        *   `@radix-ui/react-menubar`
        *   `@radix-ui/react-navigation-menu`
        *   `@radix-ui/react-popover`
        *   `@radix-ui/react-progress`
        *   `@radix-ui/react-radio-group`
        *   `@radix-ui/react-scroll-area`
        *   `@radix-ui/react-select`
        *   `@radix-ui/react-separator`
        *   `@radix-ui/react-sheet`
        *   `@radix-ui/react-slider`
        *   `@radix-ui/react-slot`
        *   `@radix-ui/react-switch`
        *   `@radix-ui/react-toast`
        *   `@radix-ui/react-tooltip`
        *   `vaul`
    *   input-otp library:
        *   `input-otp`
    *   cmdk for command menu
        *   `cmdk`
    *   class-variance-authority for class composition with variants
        *   `class-variance-authority`
    *   web-vitals for web performance measurement
        *   `web-vitals`
    *   tailwind-merge for conflict resolution between Tailwind classes
        *   `tailwind-merge`
        
*   **Backend:**
    *   Python 3
    *   FastAPI
    *   SQLAlchemy for database interaction
    *   SQLite (default, can be configured to use other databases)
    *   bcrypt for password hashing
    *   PyJWT for JSON Web Token (JWT) authentication
    *   pandas for data manipulation
    *   scikit-learn for data standardization
    *   python-multipart for handling file uploads
    *   uvicorn as ASGI server

## Prerequisites

*   **Backend:**
    *   Python 3.6+
    *   pip (Python package installer)

*   **Frontend:**
    *   Node.js (v16 or higher)
    *   npm or yarn

## Installation Instructions

### Backend

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/talhanaseem08/Clean-and-Trandform-Data.git
    cd Clean-and-Trandform-Data/backend
    ```

2.  **Create a virtual environment (optional but recommended):**

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Linux/macOS
    venv\Scripts\activate.bat # On Windows
    ```

3.  **Install the dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Set environment variables (if needed):**

    *   `DATABASE_URL`: (Optional) The SQLAlchemy database URL. Defaults to `sqlite:///./users.db` if not set.

5.  **Run the backend:**

    ```bash
    uvicorn app:app --reload
    ```

    This starts the FastAPI server on `http://localhost:8000`.

### Frontend

1.  **Navigate to the frontend directory:**

    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure the API URL:**

    *   Ensure the `baseURL` in `frontend/src/lib/api.ts` is correctly set to your backend's URL (e.g., `http://localhost:8000`).

4.  **Run the frontend development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    This starts the React development server, typically on `http://localhost:8080`.

## Usage Guide

1.  **Access the application:** Open your browser and navigate to the frontend URL (e.g., `http://localhost:8080`).

2.  **Register or Log In:** Create a new user account or log in with an existing account.

3.  **Upload CSV File:**
    *   Navigate to the "Upload & Process" tab.
    *   Drag and drop a CSV file into the designated area or click to browse your local files.
    *   Uploaded files will appear below the upload zone with file name and other details.

4.  **Configure Data Processing Options:**
    *   Select the data cleaning and transformation options.
        *   **Remove Duplicates:** Removes duplicate rows in the dataset.
        *   **Handle Missing Values:** Removes rows with missing values.
        *   **Detect Outliers:** Removes rows identified as outliers based on the IQR method.
        *   **Standardize Data:** Applies standardization (scaling) to numerical columns.

5.  **Process the Data:** Click the "Process" button. A progress bar is displayed.
    *   You will be notified with a success or error toast.

6.  **View Data Preview:**
    *   Navigate to the "Data Preview" tab.
    *   The first 10 rows of the cleaned and transformed data are displayed in a table.
    *   Summary statistics are also presented.

7.  **Download Cleaned Data:** Click the "Download Cleaned Data" button to download the transformed CSV file.

8.  **View Processing History:**

    *   Go to "History" tab to see a list of processed file records.

## API Documentation

The backend exposes the following API endpoints:

*   **`POST /api/register`**: Registers a new user.
    *   Request body:

        ```json
        {
          "username": "string",
          "password": "string"
        }
        ```

    *   Response:

        ```json
        {
          "message": "User {username} registered successfully"
        }
        ```

*   **`POST /api/login`**: Authenticates a user and returns a JWT token.
    *   Request body:

        ```json
        {
          "username": "string",
          "password": "string"
        }
        ```

    *   Response:

        ```json
        {
          "access_token": "string",
          "token_type": "bearer"
        }
        ```

*   **`POST /api/upload`**: Uploads a CSV file and processes it. Requires a valid JWT token in the `Authorization` header.
    *   Request body: `multipart/form-data` with fields `file` (the CSV file) and `options` (JSON string representing processing options).
    *   Response:

        ```json
        {
          "original_rows": number,
          "cleaned_rows": number,
          "duplicates_removed": number,
          "missing_value_rows_removed": number,
          "outliers_removed": number,
          "standardized_columns": array of strings,
          "data_preview": array of objects (first 10 rows),
          "statistics": {
            "numerical": object (descriptive statistics for numerical columns),
            "categorical": object (descriptive statistics for categorical columns)
          }
        }
        ```

*   **`POST /api/download/csv`**: Downloads a cleaned CSV file.  Requires a valid JWT token in the `Authorization` header.
    *   Request body: `multipart/form-data` with fields `file` (the CSV file) and `options` (JSON string representing processing options).
    *   Response:  `text/csv` file as a downloadable attachment.

*   **`GET /api/users/me`**: Retrieves the currently logged-in user's information. Requires a valid JWT token in the `Authorization` header.
    *   Response:

        ```json
        {
          "username": "string"
        }
        ```

*   **`GET /api/history`**: Retrieves the processing history for the logged-in user. Requires a valid JWT token in the `Authorization` header.
    *   Response: An array of history records:

        ```json
        [
          {
            "id": number,
            "filename": "string",
            "upload_date": "datetime string",
            "status": "string (completed | processing | failed)",
            "summary": { ... } // same as /api/upload response
          }
        ]
        ```

*   **`DELETE /api/history/{record_id}`**: Deletes a specific history record. Requires a valid JWT token in the `Authorization` header.

## Contributing Guidelines

1.  Fork the repository.

2.  Create a new branch for your feature or bug fix.

3.  Implement your changes, ensuring code quality and adherence to project conventions.

4.  Write unit tests for your changes.

5.  Submit a pull request with a clear description of your changes and their purpose.

## License Information

Not specified.

## Contact/Support Information

For questions, support or feature requests, pls contact:

* TALHA NASEEM - <talhan094@gmail.com>
