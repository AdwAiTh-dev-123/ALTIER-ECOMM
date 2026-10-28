import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadBufferToCloudinary = (
  buffer,
  folder = "altier/products",
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    uploadStream.end(buffer);
  });
};

export const uploadToCloudinary = async (
  imageStr,
  folder = "altier/products",
) => {
  if (
    !imageStr ||
    imageStr.startsWith("http://") ||
    imageStr.startsWith("https://")
  ) {
    return imageStr;
  }

  try {
    const uploadResult = await cloudinary.uploader.upload(imageStr, {
      folder,
      resource_type: "image",
    });

    return uploadResult.secure_url;
  } catch (err) {
    console.error("Failed to upload image to Cloudinary:", err.message);
    throw err;
  }
};

export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return null;
  }
  const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const deleteFromCloudinary = async (imageUrl) => {
  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete asset from Cloudinary:", err.message);
  }
};

export default cloudinary;
