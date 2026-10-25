import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Collection title is required"],
      trim: true,
      maxlength: [100, "Collection title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    coverPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      default: null,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "posts",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false, // Private by default
    },
  },
  { timestamps: true }
);

const CollectionModel = mongoose.model("collections", collectionSchema);
export default CollectionModel;
