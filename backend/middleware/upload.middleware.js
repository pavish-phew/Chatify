import multer from 'multer';

// Memory storage for Cloudinary upload (profile pictures)
const memoryStorage = multer.memoryStorage();

// File filter for media messages (images and videos)
const mediaFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/webm'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG, JPG, WEBP, GIF) and videos (MP4, MOV, WEBM) are allowed'), false);
    }
};

// File filter for profile pictures (images only)
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG, JPG, WEBP) are allowed'), false);
    }
};

// Upload for profile pictures (kept for backward compatibility)
export const uploadProfilePicture = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: imageFileFilter,
});

// Upload for chat media (images and videos)
export const uploadMedia = multer({
    storage: memoryStorage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    },
    fileFilter: mediaFileFilter,
});

// Default export for backward compatibility
export default uploadProfilePicture;
