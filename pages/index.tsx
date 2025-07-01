import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { 
  FiSearch, 
  FiMic, 
  FiCamera, 
  FiPlay, 
  FiThumbsUp, 
  FiThumbsDown, 
  FiPlus, 
  FiX,
  FiStar
} from 'react-icons/fi';

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

// Icons components using React Icons
const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <FiStar 
    className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
  />
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
      </Head>

      <div className="max-w-md mx-auto p-4 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Product Reviews</h1>
          <p className="text-slate-500 text-sm">Share your honest product experiences</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products or reviews..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedRating === rating 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
            >
              {rating}★
            </button>
          ))}
        </div>

        {/* Reviews List */}
        <div className="mb-20">
          {filteredReviews.map(review => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-4 mb-4 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 mb-1">{review.productName}</div>
                  <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full mb-1">
                    {review.category}
                  </div>
                  <div className="text-xs text-slate-500">by {review.author}</div>
                </div>
              </div>

              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <StarIcon key={star} filled={star <= review.rating} />
                ))}
              </div>

              <div className="text-gray-700 text-sm leading-relaxed mb-3">
                {expandedReview === review.id ? review.content : `${review.content.substring(0, 100)}...`}
              </div>

              {expandedReview === review.id && (
                <>
                  {/* Media */}
                  {(review.audioUrl || review.imageUrl) && (
                    <div className="flex gap-2 mb-3">
                      {review.imageUrl && (
                        <img
                          src={review.imageUrl}
                          alt="Product"
                          className="w-15 h-15 rounded-lg object-cover cursor-pointer"
                        />
                      )}
                      {review.audioUrl && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <button
                            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(review.audioUrl!);
                            }}
                          >
                            <FiPlay className="w-4 h-4 ml-0.5" />
                          </button>
                          <div className="text-xs text-slate-600">Audio Review</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      review.userVote === 'helpful' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(review.id, 'helpful');
                    }}
                  >
                    <FiThumbsUp className="w-4 h-4" />
                    {review.helpfulVotes}
                  </button>
                  <button
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      review.userVote === 'unhelpful' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(review.id, 'unhelpful');
                    }}
                  >
                    <FiThumbsDown className="w-4 h-4" />
                    {review.unhelpfulVotes}
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {review.createdAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAB */}
        <button 
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 hover:scale-110 transition-all flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus className="w-6 h-6" />
        </button>

        {/* Create Review Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-slate-800">Write a Review</h2>
                <button 
                  className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500"
                  value={newReview.productName}
                  onChange={(e) => setNewReview(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500"
                  value={newReview.category}
                  onChange={(e) => setNewReview(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating *</label>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className="transition-transform hover:scale-110"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    >
                      <FiStar 
                        className={`w-6 h-6 ${
                          star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review *</label>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 resize-vertical min-h-[80px]"
                  value={newReview.content}
                  onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your experience with this product..."
                />
              </div>

              {/* Media Upload */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  className={`flex-1 p-3 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    audioRecorder.isRecording 
                      ? 'border-red-300 text-red-600 bg-red-50' 
                      : 'border-gray-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                  onClick={audioRecorder.isRecording ? stopRecording : startRecording}
                >
                  <FiMic className="w-6 h-6" />
                  <div className="text-xs text-center">
                    {audioRecorder.isRecording ? 'Stop Recording' : 'Record Audio'}
                  </div>
                </button>
                <button
                  type="button"
                  className="flex-1 p-3 border-2 border-dashed border-gray-200 text-slate-600 rounded-lg flex flex-col items-center gap-2 transition-colors hover:border-blue-300 hover:text-blue-600"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiCamera className="w-6 h-6" />
                  <div className="text-xs text-center">Add Photo</div>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageCapture}
              />

              {/* Media Preview */}
              {(recordedAudio || capturedImage) && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {capturedImage && (
                    <div className="relative">
                      <img src={capturedImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        onClick={() => setCapturedImage(null)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {recordedAudio && (
                    <div className="relative">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <button
                          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center"
                          onClick={() => playAudio(recordedAudio)}
                        >
                          <FiPlay className="w-4 h-4 ml-0.5" />
                        </button>
                        <div className="text-xs text-slate-600">Recorded Audio</div>
                      </div>
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        onClick={() => setRecordedAudio(null)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-5">
                <button
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
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