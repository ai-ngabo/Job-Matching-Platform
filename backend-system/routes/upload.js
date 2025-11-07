import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: `job-platform/${folder}`,
        format: 'jpg', // Convert to jpg for images to save space
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

// @route   POST /api/upload/business-certificate
// @desc    Upload business certificate for company verification
// @access  Private (Company users only)
router.post('/business-certificate', auth, upload.single('certificate'), async (req, res) => {
  try {
    // Check if user is a company
    if (req.user.userType !== 'company') {
      return res.status(403).json({ 
        message: 'Only company accounts can upload business certificates' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: 'No certificate file uploaded' 
      });
    }

    console.log('Uploading business certificate to Cloudinary...');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'business-certificates');

    const certificateInfo = {
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      fileSize: req.file.size,
      format: result.format
    };

    // Update user's business certificate info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        'company.businessRegistration.certificate': certificateInfo 
      },
      { new: true }
    );

    console.log('Business certificate uploaded successfully:', result.secure_url);

    res.json({
      message: 'Business certificate uploaded successfully! Your account will be reviewed by our team.',
      certificate: certificateInfo,
      user: {
        id: user._id,
        company: {
          name: user.company.name,
          businessRegistration: user.company.businessRegistration
        }
      }
    });

  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ 
      message: 'Server error during certificate upload',
      error: error.message 
    });
  }
});

// @route   POST /api/upload/cv
// @desc    Upload CV for job seekers
// @access  Private (Job seeker only)
router.post('/cv', auth, upload.single('cv'), async (req, res) => {
  try {
    // Check if user is a job seeker
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only job seekers can upload CVs' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: 'No CV file uploaded' 
      });
    }

    console.log('Uploading CV to Cloudinary...');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'cvs');

    const cvInfo = {
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      fileSize: req.file.size,
      format: result.format
    };

    // Update user's CV info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        'profile.documents.cv': cvInfo 
      },
      { new: true }
    );

    console.log('CV uploaded successfully:', result.secure_url);

    res.json({
      message: 'CV uploaded successfully!',
      cv: cvInfo,
      user: {
        id: user._id,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ 
      message: 'Server error during CV upload',
      error: error.message 
    });
  }
});

// @route   POST /api/upload/id-document
// @desc    Upload ID document for job seekers
// @access  Private (Job seeker only)
router.post('/id-document', auth, upload.single('idDocument'), async (req, res) => {
  try {
    const { idType } = req.body;
    
    // Check if user is a job seeker
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only job seekers can upload ID documents' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: 'No ID document uploaded' 
      });
    }

    console.log('Uploading ID document to Cloudinary...');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'id-documents');

    const idDocumentInfo = {
      filename: req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      fileSize: req.file.size,
      format: result.format,
      idType: idType || 'national_id'
    };

    // Update user's ID document info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        'profile.documents.idDocument': idDocumentInfo 
      },
      { new: true }
    );

    console.log('ID document uploaded successfully:', result.secure_url);

    res.json({
      message: 'ID document uploaded successfully!',
      idDocument: idDocumentInfo,
      user: {
        id: user._id,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('ID document upload error:', error);
    res.status(500).json({ 
      message: 'Server error during ID document upload',
      error: error.message 
    });
  }
});

// @route   DELETE /api/upload/business-certificate
// @desc    Delete business certificate
// @access  Private (Company users only)
router.delete('/business-certificate', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'company') {
      return res.status(403).json({ 
        message: 'Only company accounts can delete certificates' 
      });
    }

    const user = await User.findById(req.user.id);
    const certificate = user.company.businessRegistration.certificate;

    if (!certificate.url) {
      return res.status(400).json({ 
        message: 'No certificate found to delete' 
      });
    }

    // Delete from Cloudinary
    if (certificate.publicId) {
      await cloudinary.uploader.destroy(certificate.publicId);
    }

    // Remove from database
    user.company.businessRegistration.certificate = {
      filename: '',
      url: '',
      publicId: '',
      uploadedAt: null
    };
    
    await user.save();

    res.json({
      message: 'Business certificate deleted successfully'
    });

  } catch (error) {
    console.error('Certificate deletion error:', error);
    res.status(500).json({ 
      message: 'Server error during certificate deletion',
      error: error.message 
    });
  }
});

export default router;