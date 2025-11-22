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

// @route   POST /api/upload/avatar
// @desc    Upload profile photo or company logo
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image provided. Please choose a photo to upload.'
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Only image files (JPEG or PNG) are allowed for profile photos.'
      });
    }

    const isCompany = req.user.userType === 'company';
    const folder = isCompany ? 'company-logos' : 'profile-avatars';

    // Remove previous asset if it exists
    const existingPublicId = isCompany
      ? req.user.company?.logoPublicId
      : req.user.profile?.avatarPublicId;

    if (existingPublicId) {
      try {
        await cloudinary.uploader.destroy(existingPublicId);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to remove previous avatar from Cloudinary:', cleanupError.message);
      }
    }

    const result = await uploadToCloudinary(req.file, folder);

    const updatePayload = isCompany
      ? {
          'company.logo': result.secure_url,
          'company.logoPublicId': result.public_id
        }
      : {
          'profile.avatar': result.secure_url,
          'profile.avatarPublicId': result.public_id
        };

    const user = await User.findByIdAndUpdate(req.user.id, updatePayload, {
      new: true
    });

    res.json({
      message: isCompany
        ? 'Company logo updated successfully.'
        : 'Profile photo updated successfully.',
      avatarUrl: isCompany ? user.company.logo : user.profile.avatar,
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        company: user.company,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      message: 'Server error during avatar upload',
      error: error.message
    });
  }
});

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
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        company: user.company,
        approvalStatus: user.approvalStatus
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
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        approvalStatus: user.approvalStatus
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
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        approvalStatus: user.approvalStatus
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
      try {
        await cloudinary.uploader.destroy(certificate.publicId);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to delete certificate from Cloudinary:', cleanupError.message);
      }
    }

    // Remove from database
    user.company.businessRegistration.certificate = {
      filename: '',
      url: '',
      publicId: '',
      uploadedAt: null,
      fileSize: 0,
      format: ''
    };
    
    await user.save();

    res.json({
      message: 'Business certificate deleted successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        company: user.company,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('Certificate deletion error:', error);
    res.status(500).json({ 
      message: 'Server error during certificate deletion',
      error: error.message 
    });
  }
});

// @route   DELETE /api/upload/cv
// @desc    Delete CV for job seekers
// @access  Private (Job seeker only)
router.delete('/cv', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only job seekers can delete CVs' 
      });
    }

    const user = await User.findById(req.user.id);
    const cv = user.profile.documents.cv;

    if (!cv.url) {
      return res.status(400).json({ 
        message: 'No CV found to delete' 
      });
    }

    // Delete from Cloudinary
    if (cv.publicId) {
      try {
        await cloudinary.uploader.destroy(cv.publicId);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to delete CV from Cloudinary:', cleanupError.message);
      }
    }

    // Remove from database
    user.profile.documents.cv = {
      filename: '',
      url: '',
      publicId: '',
      uploadedAt: null,
      fileSize: 0,
      format: ''
    };
    
    await user.save();

    res.json({
      message: 'CV deleted successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('CV deletion error:', error);
    res.status(500).json({ 
      message: 'Server error during CV deletion',
      error: error.message 
    });
  }
});

// @route   DELETE /api/upload/id-document
// @desc    Delete ID document for job seekers
// @access  Private (Job seeker only)
router.delete('/id-document', auth, async (req, res) => {
  try {
    if (req.user.userType !== 'jobseeker') {
      return res.status(403).json({ 
        message: 'Only job seekers can delete ID documents' 
      });
    }

    const user = await User.findById(req.user.id);
    const idDoc = user.profile.documents.idDocument;

    if (!idDoc.url) {
      return res.status(400).json({ 
        message: 'No ID document found to delete' 
      });
    }

    // Delete from Cloudinary
    if (idDoc.publicId) {
      try {
        await cloudinary.uploader.destroy(idDoc.publicId);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to delete ID document from Cloudinary:', cleanupError.message);
      }
    }

    // Remove from database
    user.profile.documents.idDocument = {
      filename: '',
      url: '',
      publicId: '',
      uploadedAt: null,
      fileSize: 0,
      format: '',
      idType: 'national_id'
    };
    
    await user.save();

    res.json({
      message: 'ID document deleted successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('ID document deletion error:', error);
    res.status(500).json({ 
      message: 'Server error during ID document deletion',
      error: error.message 
    });
  }
});

export default router;