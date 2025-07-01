
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
  FiStar,
  FiArrowLeft,
  FiArrowRight,
  FiCheck
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

// Audio Waveform Component
const AudioWaveform = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={`w-0.5 bg-blue-500 rounded-full transition-all duration-300 ${
          isPlaying 
            ? 'animate-pulse' 
            : ''
        }`}
        style={{
          height: isPlaying 
            ? `${8 + Math.sin((Date.now() / 200) + i) * 4}px`
            : '8px',
          animationDelay: `${i * 100}ms`
        }}
      />
    ))}
  </div>
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

// Wizard steps
enum WizardStep {
  PRODUCT_INFO = 0,
  RATING = 1,
  TEXT_REVIEW = 2,
  IMAGE = 3,
  AUDIO = 4,
  REVIEW = 5
}

const stepTitles = [
  'Product Details',
  'Rate the Product',
  'Write Your Review',
  'Add a Photo (Optional)',
  'Record Audio (Optional)',
  'Review & Submit'
];

export default function ProductReviewsApp() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.PRODUCT_INFO);

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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

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
    setCurrentStep(WizardStep.PRODUCT_INFO);
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      if (currentlyPlaying === audioUrl) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
      } else {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentlyPlaying(audioUrl);
      }
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => setCurrentlyPlaying(null);
      const handlePause = () => setCurrentlyPlaying(null);
      
      audioElement.addEventListener('ended', handleEnded);
      audioElement.addEventListener('pause', handlePause);
      
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
        audioElement.removeEventListener('pause', handlePause);
      };
    }
  }, []);

  // Wizard navigation functions
  const canProceedToNext = () => {
    switch (currentStep) {
      case WizardStep.PRODUCT_INFO:
        return newReview.productName && newReview.category;
      case WizardStep.RATING:
        return newReview.rating > 0;
      case WizardStep.TEXT_REVIEW:
        return newReview.content.trim().length > 0;
      case WizardStep.IMAGE:
      case WizardStep.AUDIO:
        return true; // Optional steps
      case WizardStep.REVIEW:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < WizardStep.REVIEW && canProceedToNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > WizardStep.PRODUCT_INFO) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setNewReview({
      productName: '',
      category: '',
      rating: 0,
      content: '',
      author: 'Anonymous User'
    });
    setRecordedAudio(null);
    setCapturedImage(null);
    setCurrentStep(WizardStep.PRODUCT_INFO);
    setShowCreateModal(false);
  };

  // Render wizard step content
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.PRODUCT_INFO:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500"
                value={newReview.productName}
                onChange={(e) => setNewReview(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>
            <div>
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
          </div>
        );

      case WizardStep.RATING:
        return (
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How would you rate this product?</h3>
              <p className="text-sm text-gray-600 mb-6">Tap the stars to rate</p>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                >
                  <FiStar 
                    className={`w-10 h-10 ${
                      star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {newReview.rating > 0 && (
              <p className="text-sm text-gray-600">
                You rated this product {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        );

      case WizardStep.TEXT_REVIEW:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tell us about your experience *</label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 resize-vertical min-h-[120px]"
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share details about your experience with this product. What did you like? What could be improved?"
              />
            </div>
            <div className="text-xs text-gray-500">
              {newReview.content.length} characters
            </div>
          </div>
        );

      case WizardStep.IMAGE:
        return (
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add a photo of the product</h3>
              <p className="text-sm text-gray-600 mb-6">This step is optional but helps other users see the product</p>
            </div>
            
            {capturedImage ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img src={capturedImage} alt="Preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                  <button
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm"
                    onClick={() => setCapturedImage(null)}
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-green-600">Photo added successfully!</p>
              </div>
            ) : (
              <button
                type="button"
                className="w-full p-6 border-2 border-dashed border-gray-200 text-slate-600 rounded-lg flex flex-col items-center gap-3 transition-colors hover:border-blue-300 hover:text-blue-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiCamera className="w-8 h-8" />
                <div className="text-sm font-medium">Take or Upload a Photo</div>
                <div className="text-xs text-gray-500">Tap to add an image</div>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageCapture}
            />
          </div>
        );

      case WizardStep.AUDIO:
        return (
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Record an audio review</h3>
              <p className="text-sm text-gray-600 mb-6">This step is optional but adds a personal touch to your review</p>
            </div>
            
            {recordedAudio ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <button
                    className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    onClick={() => playAudio(recordedAudio)}
                  >
                    {currentlyPlaying === recordedAudio ? (
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                    ) : (
                      <FiPlay className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium text-slate-700">Your Audio Review</div>
                    <AudioWaveform isPlaying={currentlyPlaying === recordedAudio} />
                  </div>
                  <button
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm ml-auto"
                    onClick={() => setRecordedAudio(null)}
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-green-600">Audio recorded successfully!</p>
              </div>
            ) : (
              <button
                type="button"
                className={`w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center gap-3 transition-colors ${
                  audioRecorder.isRecording 
                    ? 'border-red-300 text-red-600 bg-red-50' 
                    : 'border-gray-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
                onClick={audioRecorder.isRecording ? stopRecording : startRecording}
              >
                <FiMic className="w-8 h-8" />
                <div className="text-sm font-medium">
                  {audioRecorder.isRecording ? 'Tap to Stop Recording' : 'Record Audio Review'}
                </div>
                <div className="text-xs text-gray-500">
                  {audioRecorder.isRecording ? 'Recording in progress...' : 'Tap to start recording'}
                </div>
              </button>
            )}
          </div>
        );

      case WizardStep.REVIEW:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Review your submission</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700">Product</div>
                <div className="text-sm text-gray-900">{newReview.productName}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Category</div>
                <div className="text-sm text-gray-900">{newReview.category}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Rating</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarIcon key={star} filled={star <= newReview.rating} />
                  ))}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700">Review</div>
                <div className="text-sm text-gray-900">{newReview.content}</div>
              </div>
              
              {capturedImage && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Photo</div>
                  <img src={capturedImage} alt="Product" className="w-16 h-16 object-cover rounded" />
                </div>
              )}
              
              {recordedAudio && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Audio</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center"
                      onClick={() => playAudio(recordedAudio)}
                    >
                      <FiPlay className="w-3 h-3 ml-0.5" />
                    </button>
                    <span className="text-xs text-gray-600">Audio review included</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
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
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <StarIcon key={star} filled={star <= review.rating} />
                    ))}
                  </div>
                  {/* Media thumbnails */}
                  <div className="flex gap-1">
                    {review.imageUrl && (
                      <img
                        src={review.imageUrl}
                        alt="Product thumbnail"
                        className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(review.imageUrl!);
                        }}
                      />
                    )}
                    {review.audioUrl && (
                      <div 
                        className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(review.audioUrl!);
                        }}
                      >
                        {currentlyPlaying === review.audioUrl ? (
                          <AudioWaveform isPlaying={true} />
                        ) : (
                          <FiPlay className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                          className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage(review.imageUrl!);
                          }}
                        />
                      )}
                      {review.audioUrl && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg min-w-0 flex-1">
                          <button
                            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(review.audioUrl!);
                            }}
                          >
                            {currentlyPlaying === review.audioUrl ? (
                              <div className="w-3 h-3 bg-white rounded-sm"></div>
                            ) : (
                              <FiPlay className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="text-xs text-slate-600">Audio Review</div>
                            <AudioWaveform isPlaying={currentlyPlaying === review.audioUrl} />
                          </div>
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

        {/* Create Review Wizard Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Wizard Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-800">{stepTitles[currentStep]}</h2>
                  <div className="text-sm text-gray-500">Step {currentStep + 1} of {stepTitles.length}</div>
                </div>
                <button 
                  className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors"
                  onClick={resetWizard}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / stepTitles.length) * 100}%` }}
                ></div>
              </div>

              {/* Step Content */}
              <div className="mb-6">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                {currentStep > WizardStep.PRODUCT_INFO && (
                  <button
                    className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    onClick={prevStep}
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                
                <div className="flex-1"></div>
                
                {currentStep < WizardStep.REVIEW ? (
                  <button
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      canProceedToNext()
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={nextStep}
                    disabled={!canProceedToNext()}
                  >
                    {currentStep === WizardStep.IMAGE || currentStep === WizardStep.AUDIO ? 'Skip' : 'Next'}
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    onClick={handleSubmitReview}
                  >
                    <FiCheck className="w-4 h-4" />
                    Submit Review
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-full max-h-full">
              <button 
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 text-white rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors z-10"
                onClick={() => setLightboxImage(null)}
              >
                <FiX className="w-6 h-6" />
              </button>
              <img
                src={lightboxImage}
                alt="Full size product image"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        <audio ref={audioRef} />
      </div>
    </>
  );
}
