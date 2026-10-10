"""
Google Drive API storage service for the shared album archive.
Reads service account credentials from GDRIVE_SERVICE_ACCOUNT_JSON environment variable.
"""

import os
import json
import logging
from typing import Optional, Dict
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class GoogleDriveService:
    def __init__(self):
        self.root_folder_id = settings.GOOGLE_DRIVE_ROOT_FOLDER_ID
        self.creds_json = settings.GDRIVE_SERVICE_ACCOUNT_JSON
        self.service = None
        self._init_service()

    def _init_service(self):
        """Initialize Google Drive API client using service account credentials from env."""
        if not self.creds_json:
            logger.warning("GDRIVE_SERVICE_ACCOUNT_JSON not provided. Running in mock/local fallback mode.")
            return

        try:
            from google.oauth2.service_account import Credentials
            from googleapiclient.discovery import build

            info = json.loads(self.creds_json)
            scopes = ['https://www.googleapis.com/auth/drive.file']
            credentials = Credentials.from_service_account_info(info, scopes=scopes)
            self.service = build('drive', 'v3', credentials=credentials)
            logger.info("Google Drive service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive service: {e}")

    def upload_file(self, file_path: str, filename: str, mime_type: str, folder_id: Optional[str] = None) -> Dict[str, str]:
        """
        Upload file to Google Drive and return file_id and web_url.
        If service account is not configured, returns mock Google Drive identifiers.
        """
        target_folder = folder_id or self.root_folder_id

        if not self.service:
            mock_id = f"gdrive_mock_{os.path.basename(file_path)}"
            return {
                "file_id": mock_id,
                "web_url": f"https://drive.google.com/file/d/{mock_id}/view?usp=sharing"
            }

        try:
            from googleapiclient.http import MediaFileUpload

            file_metadata = {
                'name': filename,
                'parents': [target_folder] if target_folder else []
            }
            media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)
            file_obj = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink'
            ).execute()

            file_id = file_obj.get('id')
            web_url = file_obj.get('webViewLink') or f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"

            return {
                "file_id": file_id,
                "web_url": web_url
            }
        except Exception as e:
            logger.error(f"Google Drive upload error for {filename}: {e}")
            raise RuntimeError(f"Google Drive upload failed: {e}")

gdrive_service = GoogleDriveService()
