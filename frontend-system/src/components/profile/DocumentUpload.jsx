import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  File,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  X
} from 'lucide-react';
import { userService } from '../../services/userService';
import './DocumentUpload.css';

const DocumentUpload = ({ profileData, isCompany, onUploadSuccess }) => {
  const [uploads, setUploads] = useState({
    cv: {
      uploading: false,
      progress: 0,
      error: ''
    },
    id: {
      uploading: false,
      progress: 0,
      error: ''
    },
    certificate: {
      uploading: false,
      progress: 0,
      error: ''
    }
  });

  const fileInputRefs = {
    cv: useRef(null),
    id: useRef(null),
    certificate: useRef(null)
  };

  const documents = isCompany
    ? {
        certificate: {
          label: 'Business Certificate',
          description: 'Upload your business registration certificate for account verification',
          icon: '📋',
          current: profileData?.company?.businessRegistration?.certificate,
          accepted: '.pdf, .jpg, .jpeg, .png'
        }
      }
    : {
        cv: {
          label: 'CV/Resume',
          description: 'Upload your CV so employers can easily review your qualifications',
          icon: '📄',
          current: profileData?.profile?.documents?.cv,
          accepted: '.pdf, .jpg, .jpeg, .png'
        },
        id: {
          label: 'ID Document',
          description: 'Upload your national ID for verification purposes',
          icon: '🆔',
          current: profileData?.profile?.documents?.idDocument,
          accepted: '.pdf, .jpg, .jpeg, .png'
        }
      };

  const handleFileSelect = useCallback(
    async (docType, file) => {
      if (!file) return;

      const fileSize = file.size / (1024 * 1024); // Convert to MB
      if (fileSize > 5) {
        setUploads((prev) => ({
          ...prev,
          [docType]: {
            ...prev[docType],
            error: 'File size must be less than 5MB'
          }
        }));
        return;
      }

      setUploads((prev) => ({
        ...prev,
        [docType]: {
          uploading: true,
          progress: 0,
          error: ''
        }
      }));

      try {
        let response;

        if (isCompany && docType === 'certificate') {
          response = await userService.uploadBusinessCertificate(file);
        } else if (docType === 'cv') {
          response = await userService.uploadCV(file);
        } else if (docType === 'id') {
          response = await userService.uploadIDDocument(file);
        }

        setUploads((prev) => ({
          ...prev,
          [docType]: {
            uploading: false,
            progress: 100,
            error: ''
          }
        }));

        if (onUploadSuccess) {
          onUploadSuccess(response.user);
        }

        setTimeout(() => {
          setUploads((prev) => ({
            ...prev,
            [docType]: {
              uploading: false,
              progress: 0,
              error: ''
            }
          }));
        }, 2000);
      } catch (error) {
        const message = error.response?.data?.message || 'Upload failed. Please try again.';
        setUploads((prev) => ({
          ...prev,
          [docType]: {
            uploading: false,
            progress: 0,
            error: message
          }
        }));
      }
    },
    [isCompany, onUploadSuccess]
  );

  const handleDelete = useCallback(
    async (docType) => {
      if (
        !window.confirm(`Are you sure you want to delete this ${documents[docType].label}?`)
      ) {
        return;
      }

      setUploads((prev) => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          uploading: true
        }
      }));

      try {
        let response;

        if (isCompany && docType === 'certificate') {
          response = await userService.deleteBusinessCertificate();
        } else if (docType === 'cv') {
          response = await userService.deleteCV();
        } else if (docType === 'id') {
          response = await userService.deleteIDDocument();
        }

        if (onUploadSuccess) {
          onUploadSuccess(response.user);
        }

        setUploads((prev) => ({
          ...prev,
          [docType]: {
            uploading: false,
            progress: 0,
            error: ''
          }
        }));
      } catch (error) {
        const message = error.response?.data?.message || 'Deletion failed. Please try again.';
        setUploads((prev) => ({
          ...prev,
          [docType]: {
            uploading: false,
            progress: 0,
            error: message
          }
        }));
      }
    },
    [isCompany, documents, onUploadSuccess]
  );

  const handleInputChange = useCallback(
    (docType) => (event) => {
      const file = event.target.files?.[0];
      handleFileSelect(docType, file);
      if (event.target) {
        event.target.value = '';
      }
    },
    [handleFileSelect]
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="document-upload">
      <div className="upload-header">
        <h3>Documents</h3>
        <p>Upload documents to complete your profile and build trust</p>
      </div>

      <div className="documents-grid">
        {Object.entries(documents).map(([docType, docInfo]) => {
          const currentDoc = docInfo.current;
          const uploadState = uploads[docType];
          const hasDocument = !!currentDoc?.url;

          return (
            <div key={docType} className="document-card">
              <div className="document-icon">{docInfo.icon}</div>

              <div className="document-content">
                <h4>{docInfo.label}</h4>
                <p className="document-description">{docInfo.description}</p>

                {hasDocument ? (
                  <div className="document-current">
                    <div className="document-info">
                      <CheckCircle2 size={16} className="icon-success" />
                      <div>
                        <span className="document-filename">{currentDoc.filename}</span>
                        <span className="document-meta">
                          {formatFileSize(currentDoc.fileSize)} • Uploaded{' '}
                          {new Date(currentDoc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <a
                        href={currentDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-btn"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        className="icon-btn delete"
                        onClick={() => handleDelete(docType)}
                        title="Delete"
                        disabled={uploadState.uploading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="document-upload-area">
                    <input
                      ref={fileInputRefs[docType]}
                      type="file"
                      accept={docInfo.accepted}
                      onChange={handleInputChange(docType)}
                      disabled={uploadState.uploading}
                      className="file-input"
                    />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => fileInputRefs[docType].current?.click()}
                      disabled={uploadState.uploading}
                    >
                      {uploadState.uploading ? (
                        <>
                          <div className="spinner" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Choose File
                        </>
                      )}
                    </button>
                    <span className="upload-hint">or drag and drop (max 5MB)</span>
                  </div>
                )}

                {uploadState.error && (
                  <div className="upload-error">
                    <AlertCircle size={14} />
                    {uploadState.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentUpload;
