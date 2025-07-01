
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

// Types
interface Review {
  id: string;
  author: string;
  productName: string;
  category: string;
  rating: number;
  content: string;
  audioUrl?: string;
  imageUrl?: string;
  helpfulVotes: number;
  unhelpfulVotes: number;
  userVote?: 'helpful' | 'unhelpful';
  createdAt: Date;
}

interface AudioRecorderState {
  isRecording: boolean;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
}

// Global styles as a string
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
  }
  
  .container {
    max-width: 400px;
    margin: 0 auto;
    padding: 16px;
    min-height: 100vh;
  }
  
  .header {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    color: #1e293b;
    margin-bottom: 8px;
  }
  
  .subtitle {
    color: #64748b;
    font-size: 14px;
  }
  
  .search-container {
    position: relative;
    margin-bottom: 16px;
  }
  
  .search-input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    background-color: white;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
  }
  
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .filter-chip {
    padding: 6px 12px;
    background-color: #f1f5f9;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .filter-chip:hover {
    background-color: #e2e8f0;
  }
  
  .filter-chip.active {
    background-color: #3b82f6;
    color: white;
  }
  
  .reviews-list {
    margin-bottom: 80px;
  }
  
  .review-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .review-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  
  .review-info {
    flex: 1;
  }
  
  .product-name {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }
  
  .category-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #f1f5f9;
    color: #64748b;
    font-size: 12px;
    border-radius: 12px;
    margin-bottom: 4px;
  }
  
  .author {
    font-size: 12px;
    color: #64748b;
  }
  
  .rating {
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
  }
  
  .star {
    width: 16px;
    height: 16px;
  }
  
  .star.filled {
    color: #fbbf24;
  }
  
  .star.empty {
    color: #d1d5db;
  }
  
  .review-content {
    color: #374151;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 12px;
  }
  
  .review-media {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .media-thumbnail {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    cursor: pointer;
  }
  
  .audio-player {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: #f8fafc;
    border-radius: 8px;
  }
  
  .play-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background-color: #3b82f6;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .audio-info {
    font-size: 12px;
    color: #64748b;
  }
  
  .review-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .vote-buttons {
    display: flex;
    gap: 12px;
  }
  
  .vote-button {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: #64748b;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .vote-button:hover {
    background-color: #f1f5f9;
  }
  
  .vote-button.voted {
    color: #3b82f6;
    background-color: #eff6ff;
  }
  
  .review-date {
    font-size: 12px;
    color: #9ca3af;
  }
  
  .fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: all 0.2s;
  }
  
  .fab:hover {
    background-color: #2563eb;
    transform: scale(1.1);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 16px;
  }
  
  .modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }
  
  .close-button:hover {
    background-color: #f1f5f9;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }
  
  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
    cursor: pointer;
  }
  
  .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
    resize: vertical;
    min-height: 80px;
  }
  
  .rating-selector {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
  }
  
  .rating-star {
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .rating-star:hover {
    transform: scale(1.1);
  }
  
  .media-upload {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .media-button {
    flex: 1;
    padding: 12px;
    border: 2px dashed #e2e8f0;
    border-radius: 8px;
    background: none;
    color: #64748b;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }
  
  .media-button:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
  
  .media-button.recording {
    border-color: #ef4444;
    color: #ef4444;
    background-color: #fef2f2;
  }
  
  .media-text {
    font-size: 12px;
    text-align: center;
  }
  
  .button-group {
    display: flex;
    gap: 8px;
    margin-top: 20px;
  }
  
  .button {
    flex: 1;
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .button-primary {
    background-color: #3b82f6;
    color: white;
  }
  
  .button-primary:hover {
    background-color: #2563eb;
  }
  
  .button-secondary {
    background-color: #f1f5f9;
    color: #64748b;
  }
  
  .button-secondary:hover {
    background-color: #e2e8f0;
  }
  
  .hidden-input {
    display: none;
  }
  
  .media-preview {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  
  .preview-item {
    position: relative;
  }
  
  .preview-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .remove-media {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
  
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #0f172a;
      color: #f1f5f9;
    }
    
    .review-card {
      background-color: #1e293b;
    }
    
    .modal {
      background-color: #1e293b;
    }
    
    .form-input, .form-select, .form-textarea {
      background-color: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }
  }
`;

// Icons (React Icons replacement)
const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className={`star ${filled ? 'filled' : 'empty'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MicIcon = ({ isRecording = false }: { isRecording?: boolean }) => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
  </svg>
);

const CameraIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
  </svg>
);

const PlusIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Sample data
const initialReviews: Review[] = [
  {
    id: '1',
    author: 'John Doe',
    productName: 'iPhone 15 Pro',
    category: 'Electronics',
    rating: 5,
    content: 'Amazing phone with great camera quality. The titanium build feels premium and the battery life is excellent.',
    audioUrl: 'sample-audio-1.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
    helpfulVotes: 15,
    unhelpfulVotes: 2,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    author: 'Sarah Smith',
    productName: 'AirPods Pro',
    category: 'Electronics',
    rating: 4,
    content: 'Good noise cancellation but battery could be better. Sound quality is impressive for wireless earbuds.',
    helpfulVotes: 8,
    unhelpfulVotes: 1,
    createdAt: new Date('2024-01-14')
  },
  {
    id: '3',
    author: 'Mike Johnson',
    productName: 'MacBook Air M2',
    category: 'Computers',
    rating: 5,
    content: 'Perfect laptop for daily use. Fast, quiet, and excellent battery life. Highly recommended!',
    audioUrl: 'sample-audio-3.mp3',
    helpfulVotes: 22,
    unhelpfulVotes: 0,
    createdAt: new Date('2024-01-13')
  }
];

const categories = ['All', 'Electronics', 'Computers', 'Clothing', 'Books', 'Home & Garden'];

export default function ProductReviewsApp() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  
  // Form states
  const [newReview, setNewReview] = useState({
    productName: '',
    category: '',
    rating: 0,
    content: '',
    author: 'Anonymous User'
  });
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [audioRecorder, setAudioRecorder] = useState<AudioRecorderState>({
    isRecording: false,
    mediaRecorder: null,
    audioChunks: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || review.category === selectedCategory;
    const matchesRating = selectedRating === null || review.rating === selectedRating;
    
    return matchesSearch && matchesCategory && matchesRating;
  });

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
      };

      mediaRecorder.start();
      setAudioRecorder({
        isRecording: true,
        mediaRecorder,
        audioChunks
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (audioRecorder.mediaRecorder) {
      audioRecorder.mediaRecorder.stop();
      audioRecorder.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setAudioRecorder({
        isRecording: false,
        mediaRecorder: null,
        audioChunks: []
      });
    }
  };

  // Image capture
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Vote handling
  const handleVote = (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const newReview = { ...review };
        
        // Remove previous vote if exists
        if (review.userVote === 'helpful') {
          newReview.helpfulVotes--;
        } else if (review.userVote === 'unhelpful') {
          newReview.unhelpfulVotes--;
        }
        
        // Add new vote if different from previous
        if (review.userVote !== voteType) {
          if (voteType === 'helpful') {
            newReview.helpfulVotes++;
          } else {
            newReview.unhelpfulVotes++;
          }
          newReview.userVote = voteType;
        } else {
          newReview.userVote = undefined;
        }
        
        return newReview;
      }
      return review;
    }));
  };

  // Submit new review
  const handleSubmitReview = () => {
    if (!newReview.productName || !newReview.category || !newReview.rating || !newReview.content) {
      alert('Please fill in all required fields');
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      ...newReview,
      audioUrl: recordedAudio || undefined,
      imageUrl: capturedImage || undefined,
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      createdAt: new Date()
    };

    setReviews(prev => [review, ...prev]);
    
    // Reset form
    setNewReview({
      productName: '',
      category: '',
      rating: 0,
      content: '',
      author: 'Anonymous User'
    });
    setRecordedAudio(null);
    setCapturedImage(null);
    setShowCreateModal(false);
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  return (
    <>
      <Head>
        <title>Product Reviews</title>
        <meta name="description" content="Mobile-first product reviews app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </Head>

      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="title">Product Reviews</h1>
          <p className="subtitle">Share your honest product experiences</p>
        </div>

        {/* Search */}
        <div className="search-container">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search products or reviews..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="filters">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              className={`filter-chip ${selectedRating === rating ? 'active' : ''}`}
              onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
            >
              {rating}★
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="reviews-list">
          {filteredReviews.map(review => (
            <div
              key={review.id}
              className="review-card"
              onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
            >
              <div className="review-header">
                <div className="review-info">
                  <div className="product-name">{review.productName}</div>
                  <div className="category-badge">{review.category}</div>
                  <div className="author">by {review.author}</div>
                </div>
              </div>

              <div className="rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <StarIcon key={star} filled={star <= review.rating} />
                ))}
              </div>

              <div className="review-content">
                {expandedReview === review.id ? review.content : `${review.content.substring(0, 100)}...`}
              </div>

              {expandedReview === review.id && (
                <>
                  {/* Media */}
                  {(review.audioUrl || review.imageUrl) && (
                    <div className="review-media">
                      {review.imageUrl && (
                        <img
                          src={review.imageUrl}
                          alt="Product"
                          className="media-thumbnail"
                        />
                      )}
                      {review.audioUrl && (
                        <div className="audio-player">
                          <button
                            className="play-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(review.audioUrl!);
                            }}
                          >
                            <PlayIcon />
                          </button>
                          <div className="audio-info">Audio Review</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="review-actions">
                <div className="vote-buttons">
                  <button
                    className={`vote-button ${review.userVote === 'helpful' ? 'voted' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(review.id, 'helpful');
                    }}
                  >
                    <ThumbsUpIcon />
                    {review.helpfulVotes}
                  </button>
                  <button
                    className={`vote-button ${review.userVote === 'unhelpful' ? 'voted' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(review.id, 'unhelpful');
                    }}
                  >
                    <ThumbsDownIcon />
                    {review.unhelpfulVotes}
                  </button>
                </div>
                <div className="review-date">
                  {review.createdAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <button className="fab" onClick={() => setShowCreateModal(true)}>
          <PlusIcon />
        </button>

        {/* Create Review Modal */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">Write a Review</h2>
                <button className="close-button" onClick={() => setShowCreateModal(false)}>
                  <XIcon />
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newReview.productName}
                  onChange={(e) => setNewReview(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newReview.category}
                  onChange={(e) => setNewReview(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rating *</label>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className="rating-star"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    >
                      <StarIcon filled={star <= newReview.rating} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review *</label>
                <textarea
                  className="form-textarea"
                  value={newReview.content}
                  onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your experience with this product..."
                />
              </div>

              {/* Media Upload */}
              <div className="media-upload">
                <button
                  type="button"
                  className={`media-button ${audioRecorder.isRecording ? 'recording' : ''}`}
                  onClick={audioRecorder.isRecording ? stopRecording : startRecording}
                >
                  <MicIcon isRecording={audioRecorder.isRecording} />
                  <div className="media-text">
                    {audioRecorder.isRecording ? 'Stop Recording' : 'Record Audio'}
                  </div>
                </button>
                <button
                  type="button"
                  className="media-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CameraIcon />
                  <div className="media-text">Add Photo</div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden-input"
                onChange={handleImageCapture}
              />

              {/* Media Preview */}
              {(recordedAudio || capturedImage) && (
                <div className="media-preview">
                  {capturedImage && (
                    <div className="preview-item">
                      <img src={capturedImage} alt="Preview" className="preview-image" />
                      <button
                        className="remove-media"
                        onClick={() => setCapturedImage(null)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {recordedAudio && (
                    <div className="preview-item">
                      <div className="audio-player">
                        <button
                          className="play-button"
                          onClick={() => playAudio(recordedAudio)}
                        >
                          <PlayIcon />
                        </button>
                        <div className="audio-info">Recorded Audio</div>
                      </div>
                      <button
                        className="remove-media"
                        onClick={() => setRecordedAudio(null)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="button-group">
                <button
                  className="button button-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  onClick={handleSubmitReview}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}

        <audio ref={audioRef} />
      </div>
    </>
  );
}
