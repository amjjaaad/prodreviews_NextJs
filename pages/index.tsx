
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

// Icons (React Icons replacement)
const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MicIcon = ({ isRecording = false }: { isRecording?: boolean }) => (
  <svg className={`w-6 h-6 ${isRecording ? 'text-red-500' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Sample data
const sampleReviews: Review[] = [
  {
    id: '1',
    author: 'Sarah M.',
    productName: 'iPhone 15 Pro',
    category: 'Electronics',
    rating: 5,
    content: 'Amazing camera quality and battery life. The titanium build feels premium and durable.',
    helpfulVotes: 15,
    unhelpfulVotes: 2,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    author: 'Mike R.',
    productName: 'Nike Air Max 270',
    category: 'Footwear',
    rating: 4,
    content: 'Comfortable for daily wear but sizing runs slightly large. Great for workouts.',
    helpfulVotes: 8,
    unhelpfulVotes: 1,
    createdAt: new Date('2024-01-10')
  },
  {
    id: '3',
    author: 'Emma L.',
    productName: 'Dyson V15 Detect',
    category: 'Home Appliances',
    rating: 5,
    content: 'Best vacuum cleaner I\'ve ever owned. The laser detection feature is incredible!',
    helpfulVotes: 23,
    unhelpfulVotes: 0,
    createdAt: new Date('2024-01-08')
  }
];

const categories = ['All', 'Electronics', 'Footwear', 'Home Appliances', 'Beauty', 'Books', 'Clothing', 'Sports'];

export default function ProductReviewsApp() {
  const [reviews, setReviews] = useState<Review[]>(sampleReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Create review form state
  const [newReview, setNewReview] = useState({
    productName: '',
    category: 'Electronics',
    rating: 0,
    content: '',
    author: 'Anonymous User'
  });

  // Audio recording state
  const [audioRecorder, setAudioRecorder] = useState<AudioRecorderState>({
    isRecording: false,
    mediaRecorder: null,
    audioChunks: []
  });
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || review.category === selectedCategory;
    const matchesRating = selectedRating === 0 || review.rating === selectedRating;
    
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
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setAudioRecorder({
        isRecording: true,
        mediaRecorder,
        audioChunks
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microphone access is required for audio recording');
    }
  };

  const stopRecording = () => {
    if (audioRecorder.mediaRecorder) {
      audioRecorder.mediaRecorder.stop();
      setAudioRecorder({
        isRecording: false,
        mediaRecorder: null,
        audioChunks: []
      });
    }
  };

  // Camera functions
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

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Review functions
  const handleVote = (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const wasHelpful = review.userVote === 'helpful';
        const wasUnhelpful = review.userVote === 'unhelpful';
        
        let helpfulVotes = review.helpfulVotes;
        let unhelpfulVotes = review.unhelpfulVotes;
        let userVote: 'helpful' | 'unhelpful' | undefined = voteType;

        if (voteType === 'helpful') {
          if (wasHelpful) {
            helpfulVotes--;
            userVote = undefined;
          } else {
            helpfulVotes++;
            if (wasUnhelpful) unhelpfulVotes--;
          }
        } else {
          if (wasUnhelpful) {
            unhelpfulVotes--;
            userVote = undefined;
          } else {
            unhelpfulVotes++;
            if (wasHelpful) helpfulVotes--;
          }
        }

        return {
          ...review,
          helpfulVotes,
          unhelpfulVotes,
          userVote
        };
      }
      return review;
    }));
  };

  const playAudio = (audioUrl: string, reviewId: string) => {
    if (playingAudio === reviewId) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(reviewId);
      }
    }
  };

  const createReview = () => {
    if (!newReview.productName.trim() || !newReview.content.trim() || newReview.rating === 0) {
      alert('Please fill in all required fields and select a rating');
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      ...newReview,
      audioUrl: recordedAudioUrl || undefined,
      imageUrl: capturedImage || undefined,
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      createdAt: new Date()
    };

    setReviews(prev => [review, ...prev]);
    setShowCreateModal(false);
    setNewReview({
      productName: '',
      category: 'Electronics',
      rating: 0,
      content: '',
      author: 'Anonymous User'
    });
    setRecordedAudioUrl(null);
    setCapturedImage(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedRating(0);
  };

  return (
    <>
      <Head>
        <title>Product Reviews App</title>
        <meta name="description" content="Mobile-first product reviews app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-gray-900">Product Reviews</h1>
          </div>
        </header>

        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="relative">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search reviews or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(Number(e.target.value))}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm border-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value={0}>All Ratings</option>
              {[5, 4, 3, 2, 1].map(rating => (
                <option key={rating} value={rating}>{rating} Stars</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchTerm || selectedCategory !== 'All' || selectedRating !== 0) && (
              <button
                onClick={resetFilters}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="px-4 py-3 space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No reviews found matching your criteria.</p>
            </div>
          ) : (
            filteredReviews.map(review => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Review Card Header */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{review.productName}</h3>
                      <p className="text-sm text-gray-500">{review.category} • {review.author}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <StarIcon key={star} filled={star <= review.rating} />
                      ))}
                    </div>
                  </div>

                  {/* Review Content Preview */}
                  <p className="text-gray-700 text-sm mb-3">
                    {expandedReview === review.id 
                      ? review.content 
                      : `${review.content.substring(0, 100)}${review.content.length > 100 ? '...' : ''}`
                    }
                  </p>

                  {/* Media Thumbnails */}
                  <div className="flex gap-2 mb-3">
                    {review.audioUrl && (
                      <button
                        onClick={() => playAudio(review.audioUrl!, review.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {playingAudio === review.id ? <PauseIcon /> : <PlayIcon />}
                        Audio
                      </button>
                    )}
                    {review.imageUrl && (
                      <div className="w-8 h-8 rounded overflow-hidden">
                        <img src={review.imageUrl} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleVote(review.id, 'helpful')}
                        className={`flex items-center gap-1 text-xs ${
                          review.userVote === 'helpful' 
                            ? 'text-green-600 font-medium' 
                            : 'text-gray-500 hover:text-green-600'
                        }`}
                      >
                        <ThumbsUpIcon />
                        {review.helpfulVotes}
                      </button>
                      <button
                        onClick={() => handleVote(review.id, 'unhelpful')}
                        className={`flex items-center gap-1 text-xs ${
                          review.userVote === 'unhelpful' 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <ThumbsDownIcon />
                        {review.unhelpfulVotes}
                      </button>
                    </div>
                    
                    {review.content.length > 100 && (
                      <button
                        onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        {expandedReview === review.id ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-50"
        >
          <PlusIcon />
        </button>

        {/* Create Review Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full max-w-lg mx-4 rounded-t-lg sm:rounded-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Create Review</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XIcon />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newReview.productName}
                    onChange={(e) => setNewReview(prev => ({ ...prev, productName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newReview.category}
                    onChange={(e) => setNewReview(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating *
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className="p-1"
                      >
                        <StarIcon filled={star <= newReview.rating} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review *
                  </label>
                  <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your thoughts about this product..."
                  />
                </div>

                {/* Media Controls */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Add Media (Optional)</h3>
                  
                  {/* Audio Recording */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={audioRecorder.isRecording ? stopRecording : startRecording}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        audioRecorder.isRecording 
                          ? 'bg-red-50 border-red-300 text-red-700' 
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      <MicIcon isRecording={audioRecorder.isRecording} />
                      {audioRecorder.isRecording ? 'Stop Recording' : 'Record Audio'}
                    </button>
                    
                    {recordedAudioUrl && (
                      <button
                        type="button"
                        onClick={() => playAudio(recordedAudioUrl, 'preview')}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {playingAudio === 'preview' ? <PauseIcon /> : <PlayIcon />}
                        Preview
                      </button>
                    )}
                  </div>

                  {/* Camera */}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={openCamera}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50 border-gray-300 text-gray-700"
                    >
                      <CameraIcon />
                      Add Photo
                    </button>
                    
                    {capturedImage && (
                      <div className="w-12 h-12 rounded overflow-hidden">
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    onClick={createReview}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200"
                  >
                    Post Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onEnded={() => setPlayingAudio(null)}
          className="hidden"
        />
      </div>
    </>
  );
}
