import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useRouter,
  useFocusEffect,
} from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// ---------------- API CONFIGURATION ----------------

const API_URL = 'http://172.51.137.206:5000/api';

// ---------------- TYPES ----------------

type FarmerProfile = {
  name: string;
  phone: string;
  district: string;
  village: string;
  crops: string[];
};

type CommentType = {
  id: number;
  name: string;
  district: string;
  avatar: string;
  text: string;
  votes: number;
  replies: CommentType[];
  upvoted: boolean;
};

type PostType = {
  id: string | number;
  name: string;
  district: string;
  crop: string;
  time: string;
  type: 'Blog' | 'Question';
  title: string;
  description: string;

  images?: {
    url: string;
    public_id?: string;
  }[];

  image?: string;

  votes: number;
  comments: CommentType[];
  upvoted: boolean;
};

// ---------------- SAMPLE BLOG DATA ----------------

const initialPosts: PostType[] = [
  {
    id: 1,
    name: 'Ramesh',
    district: 'Mandya',
    crop: 'Rice',
    time: '2 hours ago',
    type: 'Blog',
    title: 'My experience with organic rice cultivation 🌱',
    description:
      'This season, I tried vermicompost and jeevamrutha on my 2-acre field. The crop growth was better, and I noticed improved soil moisture and fewer pests. Sharing a few photos from my farm.',
    image:
      'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=900',
    votes: 124,
    upvoted: false,
    comments: [
      {
        id: 101,
        name: 'Suresh',
        district: 'Mysuru',
        avatar: 'https://i.pravatar.cc/150?img=12',
        text: 'Great work, Ramesh! Which quantity of vermicompost did you use per acre?',
        votes: 26,
        upvoted: false,
        replies: [
          {
            id: 102,
            name: 'Ramesh',
            district: 'Mandya',
            avatar: 'https://i.pravatar.cc/150?img=11',
            text: 'I used around 2 tonnes per acre.',
            votes: 18,
            upvoted: false,
            replies: [],
          },
        ],
      },
      {
        id: 103,
        name: 'Lakshmi',
        district: 'Tumakuru',
        avatar: 'https://i.pravatar.cc/150?img=47',
        text: 'Did you observe any change in water requirement?',
        votes: 7,
        upvoted: false,
        replies: [],
      },
    ],
  },

  {
    id: 3,
    name: 'Manjunath',
    district: 'Belagavi',
    crop: 'Sugarcane',
    time: 'Yesterday',
    type: 'Blog',
    title: 'Tips for improving sugarcane yield',
    description:
      'Sharing some useful practices that helped improve my sugarcane yield this season. Proper irrigation and soil management made a difference.',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900',
    votes: 89,
    upvoted: false,
    comments: [],
  },
];

// ---------------- MAIN SCREEN ----------------

export default function HomeScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<PostType[]>(initialPosts);

  const [activeFilter, setActiveFilter] = useState('All Posts');

  const [activeTab, setActiveTab] = useState('Home');

  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);

  const [commentText, setCommentText] = useState('');

  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const [replyText, setReplyText] = useState('');

  const [createVisible, setCreateVisible] = useState(false);

  const [newTitle, setNewTitle] = useState('');

  const [newDescription, setNewDescription] = useState('');

  const [newPostType, setNewPostType] = useState<'Blog' | 'Question'>(
    'Blog'
  );

  const [phone, setPhone] = useState('');

  // ---------------- SEARCH STATES ----------------

  const [searchQuery, setSearchQuery] = useState('');

  const [searchLoading, setSearchLoading] = useState(false);

  // Keeps track of the latest search request
  const requestIdRef = useRef(0);

  // Stores the latest search query for screen focus refresh
  const searchQueryRef = useRef('');

  // Avoids an unnecessary initial search request
  const previousSearchRef = useRef('');

  // ---------------- REPORT STATES ----------------

const [reportModalVisible, setReportModalVisible] = useState(false);
const [reportContentId, setReportContentId] = useState('');
const [reportReason, setReportReason] = useState('');
const [reportDescription, setReportDescription] = useState('');
const [reportSubmitting, setReportSubmitting] = useState(false);
const [reportMenuPostId, setReportMenuPostId] = useState<string | number | null>(null);

const reportReasons = [
  'Spam',
  'Harassment',
  'Misinformation',
  'Inappropriate Content',
  'Irrelevant Content',
  'Other',
];

  // ---------------- LOAD PROFILE ----------------

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem('farmerProfile');

        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      } catch (error) {
        console.log('Profile loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Keep the latest search query available to focus effect
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // ---------------- FETCH QUESTIONS FROM MONGODB ----------------

  const fetchQuestions = useCallback(async (searchTerm = '') => {
    const currentRequestId = ++requestIdRef.current;

    try {
      setSearchLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        console.log('Authentication token not found');
        return;
      }

      let url = `${API_URL}/questions?sort=latest&page=1&limit=100`;

      // Add search parameter when a query is provided
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      // Ignore older requests if a newer search has started
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        console.log('Question API Error:', data.message);
        return;
      }

      if (!data.success || !Array.isArray(data.questions)) {
        console.log('Invalid API response:', data);
        return;
      }

      // Convert MongoDB questions into frontend PostType

      const backendQuestions: PostType[] = data.questions.map(
        (question: any) => ({
          id: question._id,

          name: question.askedBy?.name || 'Farmer',

          district:
            question.district ||
            question.askedBy?.district ||
            '',

          crop: question.crop || 'General',

          time: question.createdAt
            ? new Date(question.createdAt).toLocaleString()
            : 'Recently',

          type: 'Question',

          title: question.title || '',

          description: question.description || '',

          // Preserve all uploaded images
          images: Array.isArray(question.images)
            ? question.images
                .filter((image: any) => image?.url)
                .map((image: any) => ({
                  url: image.url,
                  public_id: image.public_id,
                }))
            : [],

          votes: Number(question.upvotes || 0),

          upvoted: false,

          comments: [],
        })
      );

      // Preserve existing blogs and replace questions with database data

      setPosts(previous => {
        const existingBlogs = previous.filter(
          post => post.type === 'Blog'
        );

        return [
          ...backendQuestions,
          ...existingBlogs,
        ];
      });

      console.log(
        'Questions successfully fetched:',
        backendQuestions.length
      );

    } catch (error) {
      if (currentRequestId === requestIdRef.current) {
        console.log('Fetch Questions Error:', error);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setSearchLoading(false);
      }
    }
  }, []);

  // ---------------- REFRESH FEED WHEN SCREEN OPENS ----------------

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        fetchQuestions(searchQueryRef.current);
      }
    }, [profile, fetchQuestions])
  );

  // ---------------- LIVE SEARCH WITH DEBOUNCE ----------------

  useEffect(() => {
    const searchTerm = searchQuery.trim();

    // Do not repeat the same request
    if (searchTerm === previousSearchRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      previousSearchRef.current = searchTerm;

      fetchQuestions(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchQuestions]);

  // ---------------- LOGIN ----------------

  const handleLogin = () => {
    if (phone.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Enter a valid 10-digit phone number.'
      );
      return;
    }

    router.push({
      pathname: '/otp',
      params: { phone },
    });
  };

  // ---------------- LOGOUT ----------------

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'farmerProfile',
        'authToken',
      ]);

      // Invalidate any pending search request
      requestIdRef.current++;

      setProfile(null);
      setPosts(initialPosts);
      setSearchQuery('');
      setSearchLoading(false);
      previousSearchRef.current = '';

    } catch (error) {
      Alert.alert('Error', 'Unable to logout.');
    }
  };

  // ---------------- UPVOTE POST ----------------

  const handlePostUpvote = (postId: string | number) => {
    setPosts(previous =>
      previous.map(post => {
        if (post.id !== postId) return post;

        return {
          ...post,
          votes: post.upvoted
            ? post.votes - 1
            : post.votes + 1,
          upvoted: !post.upvoted,
        };
      })
    );

    setSelectedPost(previous => {
      if (!previous || previous.id !== postId) {
        return previous;
      }

      return {
        ...previous,
        votes: previous.upvoted
          ? previous.votes - 1
          : previous.votes + 1,
        upvoted: !previous.upvoted,
      };
    });
  };

  // ---------------- UPVOTE COMMENT ----------------

  const updateCommentVote = (
    comments: CommentType[],
    commentId: number
  ): CommentType[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          votes: comment.upvoted
            ? comment.votes - 1
            : comment.votes + 1,
          upvoted: !comment.upvoted,
        };
      }

      return {
        ...comment,
        replies: updateCommentVote(
          comment.replies,
          commentId
        ),
      };
    });
  };

  const handleCommentUpvote = (commentId: number) => {
    if (!selectedPost) return;

    const updatedComments = updateCommentVote(
      selectedPost.comments,
      commentId
    );

    const updatedPost = {
      ...selectedPost,
      comments: updatedComments,
    };

    setSelectedPost(updatedPost);

    setPosts(previous =>
      previous.map(post =>
        post.id === updatedPost.id
          ? updatedPost
          : post
      )
    );
  };

  // ---------------- ADD COMMENT ----------------

  const handleAddComment = () => {
    if (!selectedPost || !commentText.trim()) return;

    const newComment: CommentType = {
      id: Date.now(),
      name: profile?.name || 'Farmer',
      district: profile?.district || '',
      avatar: 'https://i.pravatar.cc/150?img=68',
      text: commentText.trim(),
      votes: 0,
      upvoted: false,
      replies: [],
    };

    const updatedPost = {
      ...selectedPost,
      comments: [
        ...selectedPost.comments,
        newComment,
      ],
    };

    setSelectedPost(updatedPost);

    setPosts(previous =>
      previous.map(post =>
        post.id === updatedPost.id
          ? updatedPost
          : post
      )
    );

    setCommentText('');
  };

  // ---------------- ADD REPLY ----------------

  const addReplyToComment = (
    comments: CommentType[],
    parentId: number,
    reply: CommentType
  ): CommentType[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [
            ...comment.replies,
            reply,
          ],
        };
      }

      return {
        ...comment,
        replies: addReplyToComment(
          comment.replies,
          parentId,
          reply
        ),
      };
    });
  };

  const handleAddReply = () => {
    if (
      !selectedPost ||
      !replyText.trim() ||
      replyingTo === null
    ) {
      return;
    }

    const reply: CommentType = {
      id: Date.now(),
      name: profile?.name || 'Farmer',
      district: profile?.district || '',
      avatar: 'https://i.pravatar.cc/150?img=68',
      text: replyText.trim(),
      votes: 0,
      upvoted: false,
      replies: [],
    };

    const updatedPost = {
      ...selectedPost,
      comments: addReplyToComment(
        selectedPost.comments,
        replyingTo,
        reply
      ),
    };

    setSelectedPost(updatedPost);

    setPosts(previous =>
      previous.map(post =>
        post.id === updatedPost.id
          ? updatedPost
          : post
      )
    );

    setReplyText('');
    setReplyingTo(null);
  };

  // ---------------- CREATE POST ----------------

  const handleCreatePost = () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert(
        'Missing details',
        'Please enter a title and description.'
      );
      return;
    }

    const newPost: PostType = {
      id: Date.now(),
      name: profile?.name || 'Farmer',
      district: profile?.district || '',
      crop: profile?.crops?.[0] || 'General',
      time: 'Just now',
      type: newPostType,
      title: newTitle.trim(),
      description: newDescription.trim(),
      votes: 0,
      upvoted: false,
      comments: [],
    };

    setPosts(previous => [
      newPost,
      ...previous,
    ]);

    setNewTitle('');
    setNewDescription('');
    setCreateVisible(false);
    setActiveFilter('All Posts');
    setActiveTab('Home');
  };

  // ---------------- CLEAR SEARCH ----------------

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // ---------------- OPEN REPORT MODAL ----------------

const openReportModal = (contentId: string) => {
  console.log('Opening report modal for:', contentId);
  setReportContentId(contentId);
  setReportReason('');
  setReportDescription('');
  setReportMenuPostId(null);
  setReportModalVisible(true);
};

// ---------------- SUBMIT REPORT ----------------

const handleSubmitReport = async () => {
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Validate reason
  if (!reportReason) {
    showMessage(
      'Select a reason',
      'Please select a reason for reporting.'
    );
    return;
  }

  // Validate question ID
  if (!reportContentId || !String(reportContentId).trim()) {
    showMessage(
      'Error',
      'Question ID is missing. Please try again.'
    );
    return;
  }

  try {
    setReportSubmitting(true);

    const authToken = await AsyncStorage.getItem('authToken');

    if (!authToken) {
      throw new Error('Please log in again.');
    }

    // Prepare request body
    const reportData = {
      contentType: 'Question',
      contentId: String(reportContentId).trim(),
      reason: reportReason,
      description: reportDescription.trim(),
    };

    console.log('QUESTION REPORT DATA:', reportData);

    // API request
    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    const data = await response.json();

    console.log('REPORT STATUS:', response.status);
    console.log('REPORT RESPONSE:', data);

    if (!response.ok) {
      throw new Error(
        data.message || 'Unable to submit report.'
      );
    }

    // Reset modal fields
    setReportModalVisible(false);
    setReportContentId('');
    setReportReason('');
    setReportDescription('');

    showMessage(
      'Report Submitted',
      'Thank you for helping keep FarmerConnect safe.'
    );

  } catch (error: any) {
    console.log('QUESTION REPORT ERROR:', error);

    showMessage(
      'Report Failed',
      error.message || 'Something went wrong.'
    );

  } finally {
    setReportSubmitting(false);
  }
};
  // ---------------- FILTER POSTS ----------------

  const filteredPosts = posts.filter(post => {

    // When searching, show only questions
    if (
      searchQuery.trim() &&
      post.type !== 'Question'
    ) {
      return false;
    }

    if (activeFilter === 'Blogs') {
      return post.type === 'Blog';
    }

    if (activeFilter === 'Questions') {
      return post.type === 'Question';
    }

    if (activeFilter === 'My District') {
      return post.district === profile?.district;
    }

    return true;
  });

  // ---------------- COMMENT COMPONENT ----------------

  const renderComments = (
    comments: CommentType[],
    depth = 0
  ) => {
    return comments.map(comment => (
      <View
        key={comment.id}
        style={[
          styles.commentContainer,
          { marginLeft: depth > 0 ? 30 : 0 },
        ]}
      >
        <View style={styles.commentRow}>
          <Image
            source={{ uri: comment.avatar }}
            style={styles.commentAvatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.commentName}>
              {comment.name} ({comment.district})
            </Text>

            <Text style={styles.commentText}>
              {comment.text}
            </Text>

            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={() =>
                  handleCommentUpvote(comment.id)
                }
                style={[
                  styles.smallVote,
                  comment.upvoted && styles.activeVote,
                ]}
              >
                <Text style={styles.voteText}>
                  ⬆ {comment.votes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReplyingTo(comment.id)}
              >
                <Text style={styles.replyButton}>
                  ↩ Reply
                </Text>
              </TouchableOpacity>
            </View>

            {replyingTo === comment.id && (
              <View style={styles.replyInputContainer}>
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Write a reply..."
                  style={styles.replyInput}
                />

                <TouchableOpacity onPress={handleAddReply}>
                  <Text style={styles.sendText}>
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {comment.replies.length > 0 &&
          renderComments(
            comment.replies,
            depth + 1
          )}
      </View>
    ));
  };

  // ---------------- LOADING ----------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#287A3D"
        />
      </View>
    );
  }

  // ---------------- LOGIN SCREEN ----------------

  if (!profile) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <Text style={styles.logo}>
          🌱 Krushika Dhara
        </Text>

        <Text style={styles.tagline}>
          Connecting Farmers, Growing Together
        </Text>

        <Text style={styles.loginTitle}>
          Welcome Back!
        </Text>

        <TextInput
          placeholder="Enter your mobile number"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          style={styles.loginInput}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>
            Continue
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ---------------- MAIN UI ----------------

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={{ fontSize: 25 }}>
              🌱
            </Text>
          </View>

          <View>
            <Text style={styles.logoTitle}>
              Krushika Dhara
            </Text>

            <Text style={styles.logoSubtitle}>
              Farmer Community
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              // Focus the search input through the search bar below
            }}
          >
            <Text style={styles.headerIcon}>
              ⌕
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.headerIcon}>
              ♧
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.profileIcon}>
              👨🏽
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 110 }}
      >

        {/* CREATE POST */}

        <View style={styles.createCard}>
          <Text style={styles.createQuestion}>
            What's happening on your farm today?
          </Text>

          <View style={styles.createActions}>
            <TouchableOpacity
              style={styles.createAction}
              onPress={() => {
                setNewPostType('Blog');
                setCreateVisible(true);
              }}
            >
              <Text style={styles.createActionText}>
                ✎ Write Blog
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createAction}
              onPress={() => router.push('/ask-question')}
            >
              <Text style={styles.createActionText}>
                ? Ask Question
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createAction}
              onPress={() => {
                setNewPostType('Blog');
                setCreateVisible(true);
              }}
            >
              <Text style={styles.createActionText}>
                ▧ Add Photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>
            ⌕
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search questions, crops or keywords..."
            placeholderTextColor="#829182"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />

          {searchLoading && (
            <ActivityIndicator
              size="small"
              color="#287A3D"
              style={{ marginRight: 8 }}
            />
          )}

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearSearchButton}
            >
              <Text style={styles.clearSearchText}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTERS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {[
            'All Posts',
            'Blogs',
            'Questions',
            'My District',
          ].map(filter => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterButton,
                activeFilter === filter &&
                  styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter &&
                    styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SEARCH RESULT COUNT */}

        {searchQuery.trim() !== '' && !searchLoading && (
          <Text style={styles.searchResultText}>
            {filteredPosts.length} matching question
            {filteredPosts.length === 1 ? '' : 's'} found
          </Text>
        )}

        {/* FEED */}

        {filteredPosts.map(post => (
          <View
            key={post.id}
            style={styles.postCard}
          >

            {/* POST HEADER */}

            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 22 }}>
                  👨🏽
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.postAuthor}>
                  {post.name} ({post.district})
                </Text>

                <Text style={styles.postMeta}>
                  {post.crop} · {post.time}
                </Text>
              </View>

              {post.type === 'Question' && (
  <TouchableOpacity
    onPress={() =>
      setReportMenuPostId(
        reportMenuPostId === post.id ? null : post.id
      )
    }
    style={{ padding: 8 }}
  >
    <Text style={styles.moreIcon}>
      •••
    </Text>
  </TouchableOpacity>
)}
            </View>

            {/* REPORT MENU */}

{reportMenuPostId === post.id && (
  <TouchableOpacity
    style={styles.reportMenuButton}
    onPress={() => openReportModal(String(post.id))}
  >
    <Text style={styles.reportMenuText}>
      ⚑ Report Question
    </Text>
  </TouchableOpacity>
)}

            {/* POST TYPE */}

            <View
              style={[
                styles.postTypeBadge,
                post.type === 'Question' &&
                  styles.questionBadge,
              ]}
            >
              <Text style={styles.postTypeText}>
                {post.type === 'Blog'
                  ? '▤ Blog'
                  : '? Question'}
              </Text>
            </View>

            {/* POST CONTENT */}

            <TouchableOpacity
              onPress={() => {
                if (post.type === 'Question') {
                  router.push({
                    pathname: '/question/[id]',
                    params: {
                      id: String(post.id),
                    },
                  });
                } else {
                  setSelectedPost(post);
                }
              }}
            >
              <Text style={styles.postTitle}>
                {post.title}
              </Text>

              <Text
                style={styles.postDescription}
                numberOfLines={4}
              >
                {post.description}
              </Text>

              <Text style={styles.readMore}>
                Read more
              </Text>
            </TouchableOpacity>

            {/* POST IMAGES */}

            {post.images && post.images.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.postImagesContainer}
              >
                {post.images.map((image, index) => (
                  <Image
                    key={
                      image.public_id ||
                      `${image.url}-${index}`
                    }
                    source={{ uri: image.url }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : post.image ? (
              <Image
                source={{ uri: post.image }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : null}

            {/* POST ACTIONS */}

            <View style={styles.postActions}>
              <TouchableOpacity
                onPress={() => handlePostUpvote(post.id)}
                style={[
                  styles.voteButton,
                  post.upvoted && styles.activeVote,
                ]}
              >
                <Text style={styles.voteText}>
                  ⬆ {post.votes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (post.type === 'Question') {
                    router.push({
                      pathname: '/question/[id]',
                      params: {
                        id: String(post.id),
                      },
                    });
                  } else {
                    setSelectedPost(post);
                  }
                }}
              >
                <Text style={styles.actionText}>
                  💬 {post.type === 'Question'
                    ? 'View Answers'
                    : `${post.comments.length} Comments`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  Alert.alert(
                    'Share',
                    'Share functionality will be connected later.'
                  )
                }
              >
                <Text style={styles.actionText}>
                  ↗ Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* EMPTY RESULTS */}

        {searchLoading ? (
          <ActivityIndicator
            size="large"
            color="#287A3D"
            style={{ marginTop: 25 }}
          />
        ) : filteredPosts.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? 'No matching questions found. Try another keyword or crop name.'
              : 'No posts found. Be the first to share something!'}
          </Text>
        ) : null}

      </ScrollView>

      {/* BOTTOM NAVIGATION */}

      <View style={styles.bottomNavigation}>
        {[
          { name: 'Home', icon: '⌂' },
          { name: 'Explore', icon: '◉' },
          { name: 'Post', icon: '+' },
          { name: 'Questions', icon: '?' },
          { name: 'Profile', icon: '♙' },
        ].map(item => (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => {
              if (item.name === 'Post') {
                setNewPostType('Blog');
                setCreateVisible(true);
              } else if (item.name === 'Questions') {
                setActiveFilter('Questions');
                setActiveTab('Questions');
              } else if (item.name === 'Home') {
                setActiveFilter('All Posts');
                setActiveTab('Home');
              } else {
                setActiveTab(item.name);

                Alert.alert(
                  item.name,
                  'This section will be developed next.'
                );
              }
            }}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === item.name &&
                  styles.activeNavIcon,
              ]}
            >
              {item.icon}
            </Text>

            <Text
              style={[
                styles.navText,
                activeTab === item.name &&
                  styles.activeNavText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CREATE POST MODAL */}

      <Modal
        visible={createVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.createModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Create {newPostType}
              </Text>

              <TouchableOpacity
                onPress={() => setCreateVisible(false)}
              >
                <Text style={styles.closeButton}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Enter title..."
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.modalTitleInput}
            />

            <TextInput
              placeholder="Share your farming knowledge or experience..."
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              textAlignVertical="top"
              style={styles.modalDescriptionInput}
            />

            <TouchableOpacity
              style={styles.publishButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.publishButtonText}>
                Publish {newPostType}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DISCUSSION MODAL */}

      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Discussion
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedPost(null)}
              >
                <Text style={styles.closeButton}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <>
                <ScrollView style={{ flex: 1 }}>
                  <Text style={styles.detailPostTitle}>
                    {selectedPost.title}
                  </Text>

                  <Text style={styles.detailPostDescription}>
                    {selectedPost.description}
                  </Text>

                  {/* DISPLAY ALL IMAGES */}

                  {selectedPost.images &&
                  selectedPost.images.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.postImagesContainer}
                    >
                      {selectedPost.images.map((image, index) => (
                        <Image
                          key={
                            image.public_id ||
                            `${image.url}-${index}`
                          }
                          source={{ uri: image.url }}
                          style={styles.postImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  ) : selectedPost.image ? (
                    <Image
                      source={{ uri: selectedPost.image }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      onPress={() =>
                        handlePostUpvote(selectedPost.id)
                      }
                    >
                      <Text style={styles.voteText}>
                        ⬆ {selectedPost.votes} Upvotes
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.postMeta}>
                      {selectedPost.comments.length} Comments
                    </Text>
                  </View>

                  <Text style={styles.commentsHeading}>
                    Comments ({selectedPost.comments.length})
                  </Text>

                  {selectedPost.comments.length > 0 ? (
                    renderComments(selectedPost.comments)
                  ) : (
                    <Text style={styles.emptyText}>
                      No comments yet. Start the discussion!
                    </Text>
                  )}
                </ScrollView>

                <View style={styles.commentInputContainer}>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Add a comment..."
                    style={styles.commentInput}
                  />

                  <TouchableOpacity onPress={handleAddComment}>
                    <Text style={styles.sendText}>
                      ➤
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* REPORT QUESTION MODAL */}

<Modal
  visible={reportModalVisible}
  animationType="fade"
  transparent
  onRequestClose={() => {
    if (!reportSubmitting) {
      setReportModalVisible(false);
    }
  }}
>
  <KeyboardAvoidingView
    style={styles.modalOverlay}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <View style={styles.reportModal}>

      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          Report Question
        </Text>

        <TouchableOpacity
          onPress={() => setReportModalVisible(false)}
          disabled={reportSubmitting}
        >
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.reportHeading}>
        Why are you reporting this question?
      </Text>

      <ScrollView
        style={styles.reportReasonsContainer}
        keyboardShouldPersistTaps="handled"
      >
        {reportReasons.map(reason => (
          <TouchableOpacity
            key={reason}
            style={[
              styles.reportReason,
              reportReason === reason &&
                styles.selectedReportReason,
            ]}
            onPress={() => setReportReason(reason)}
          >
            <Text
              style={[
                styles.reportReasonText,
                reportReason === reason &&
                  styles.selectedReportReasonText,
              ]}
            >
              {reportReason === reason ? '◉ ' : '○ '}
              {reason}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TextInput
        placeholder="Additional details (optional)"
        placeholderTextColor="#829182"
        value={reportDescription}
        onChangeText={setReportDescription}
        multiline
        maxLength={500}
        textAlignVertical="top"
        style={styles.reportDescriptionInput}
      />

      <Text style={styles.reportCharacterCount}>
        {reportDescription.length}/500
      </Text>

      <TouchableOpacity
        style={[
          styles.submitReportButton,
          reportSubmitting && { opacity: 0.6 },
        ]}
        onPress={handleSubmitReport}
        disabled={reportSubmitting}
      >
        {reportSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitReportText}>
            Submit Report
          </Text>
        )}
      </TouchableOpacity>

    </View>
  </KeyboardAvoidingView>
</Modal>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F8F1',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // LOGIN

  loginContainer: {
    flex: 1,
    backgroundColor: '#F4F8F1',
    justifyContent: 'center',
    padding: 25,
  },

  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#246B35',
    textAlign: 'center',
  },

  tagline: {
    textAlign: 'center',
    color: '#66816A',
    marginTop: 8,
    marginBottom: 45,
  },

  loginTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#243B29',
    marginBottom: 20,
  },

  loginInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE9D7',
  },

  loginButton: {
    backgroundColor: '#287A3D',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },

  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#F4F8F1',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#DFF0D8',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  logoTitle: {
    color: '#246B35',
    fontWeight: 'bold',
    fontSize: 20,
  },

  logoSubtitle: {
    fontSize: 12,
    color: '#66816A',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  headerIcon: {
    fontSize: 27,
    color: '#246B35',
  },

  profileIcon: {
    fontSize: 28,
  },

  // CREATE POST

  createCard: {
    backgroundColor: '#EAF4E5',
    marginHorizontal: 15,
    marginTop: 8,
    padding: 18,
    borderRadius: 18,
  },

  createQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#344C36',
    marginBottom: 18,
  },

  createActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },

  createAction: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flex: 1,
    alignItems: 'center',
  },

  createActionText: {
    color: '#246B35',
    fontWeight: '600',
    fontSize: 12,
  },

  // SEARCH

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE9D7',
  },

  searchIcon: {
    fontSize: 25,
    color: '#287A3D',
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#243B29',
    height: '100%',
  },

  clearSearchButton: {
    padding: 8,
  },

  clearSearchText: {
    fontSize: 17,
    color: '#788679',
    fontWeight: 'bold',
  },

  searchResultText: {
    color: '#66816A',
    fontSize: 13,
    marginHorizontal: 18,
    marginBottom: 10,
  },

  // FILTERS

  filterScroll: {
    marginVertical: 18,
    paddingLeft: 15,
    flexGrow: 0,
  },

  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE9D7',
    marginRight: 10,
  },

  activeFilterButton: {
    backgroundColor: '#287A3D',
    borderColor: '#287A3D',
  },

  filterText: {
    color: '#304936',
    fontWeight: '500',
  },

  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // POST CARD

  postCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5EBE1',
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatar: {
    width: 43,
    height: 43,
    backgroundColor: '#E6F0E1',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  postAuthor: {
    fontWeight: 'bold',
    color: '#202D23',
    fontSize: 15,
  },

  postMeta: {
    color: '#788679',
    fontSize: 12,
    marginTop: 3,
  },

  moreIcon: {
    fontSize: 17,
    color: '#555',
  },

  postTypeBadge: {
    backgroundColor: '#E4F3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 9,
  },

  questionBadge: {
    backgroundColor: '#EFE8FF',
  },

  postTypeText: {
    color: '#246B35',
    fontWeight: 'bold',
    fontSize: 12,
  },

  postTitle: {
    color: '#18251B',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 25,
    marginBottom: 8,
  },

  postDescription: {
    color: '#354039',
    fontSize: 14,
    lineHeight: 21,
  },

  readMore: {
    color: '#287A3D',
    fontWeight: 'bold',
    marginTop: 8,
  },

  // MULTIPLE IMAGES

  postImagesContainer: {
    marginTop: 12,
  },

  postImage: {
    width: 250,
    height: 180,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#E5EBE1',
  },

  // POST ACTIONS

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EDF0EA',
    marginTop: 15,
    paddingTop: 13,
  },

  voteButton: {
    backgroundColor: '#EFF7EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  activeVote: {
    backgroundColor: '#D6EDD0',
  },

  voteText: {
    color: '#287A3D',
    fontWeight: 'bold',
    fontSize: 13,
  },

  actionButton: {
    paddingHorizontal: 5,
  },

  actionText: {
    color: '#354039',
    fontSize: 13,
  },

  emptyText: {
    textAlign: 'center',
    color: '#778477',
    margin: 30,
  },

  // BOTTOM NAVIGATION

  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EBE1',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  navIcon: {
    fontSize: 23,
    color: '#536357',
  },

  activeNavIcon: {
    color: '#287A3D',
    fontWeight: 'bold',
  },

  navText: {
    fontSize: 11,
    color: '#536357',
    marginTop: 3,
  },

  activeNavText: {
    color: '#287A3D',
    fontWeight: 'bold',
  },

  // MODALS

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 15,
  },

  createModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },

  commentModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    height: '90%',
    padding: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#243B29',
  },

  closeButton: {
    fontSize: 22,
    color: '#555',
  },

  modalTitleInput: {
    borderWidth: 1,
    borderColor: '#DCE9D7',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
  },

  modalDescriptionInput: {
    borderWidth: 1,
    borderColor: '#DCE9D7',
    padding: 14,
    borderRadius: 10,
    height: 150,
    marginBottom: 18,
  },

  publishButton: {
    backgroundColor: '#287A3D',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  publishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // COMMENTS

  detailPostTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#243B29',
    marginBottom: 10,
  },

  detailPostDescription: {
    fontSize: 14,
    color: '#48544A',
    lineHeight: 22,
  },

  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#E5EBE1',
  },

  commentsHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#243B29',
  },

  commentContainer: {
    marginBottom: 18,
    paddingTop: 5,
  },

  commentRow: {
    flexDirection: 'row',
  },

  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
    marginRight: 10,
  },

  commentName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#26382A',
    marginBottom: 5,
  },

  commentText: {
    fontSize: 14,
    color: '#354039',
    lineHeight: 20,
  },

  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 10,
  },

  smallVote: {
    backgroundColor: '#EFF7EB',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
  },

  replyButton: {
    color: '#536357',
    fontWeight: '600',
    fontSize: 12,
  },

  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  replyInput: {
    flex: 1,
    backgroundColor: '#F4F8F1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
  },

  sendText: {
    color: '#287A3D',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 12,
  },

  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E5EBE1',
    paddingTop: 12,
  },

  commentInput: {
    flex: 1,
    backgroundColor: '#F4F8F1',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
  },
  // ---------------- REPORT STYLES ----------------

reportMenuButton: {
  alignSelf: 'flex-end',
  backgroundColor: '#FFF0EF',
  paddingHorizontal: 15,
  paddingVertical: 10,
  borderRadius: 10,
  marginBottom: 12,
},

reportMenuText: {
  color: '#C62828',
  fontSize: 13,
  fontWeight: '600',
},

reportModal: {
  backgroundColor: 'white',
  borderRadius: 20,
  padding: 20,
  maxHeight: '90%',
},

reportHeading: {
  fontSize: 15,
  fontWeight: '600',
  color: '#243B29',
  marginBottom: 12,
},

reportReasonsContainer: {
  maxHeight: 260,
},

reportReason: {
  padding: 12,
  borderWidth: 1,
  borderColor: '#DCE9D7',
  borderRadius: 10,
  marginBottom: 8,
},

selectedReportReason: {
  backgroundColor: '#EAF4E5',
  borderColor: '#287A3D',
},

reportReasonText: {
  color: '#354039',
  fontSize: 14,
},

selectedReportReasonText: {
  color: '#287A3D',
  fontWeight: 'bold',
},

reportDescriptionInput: {
  borderWidth: 1,
  borderColor: '#DCE9D7',
  borderRadius: 10,
  padding: 12,
  height: 90,
  marginTop: 10,
  color: '#243B29',
},

reportCharacterCount: {
  textAlign: 'right',
  fontSize: 11,
  color: '#829182',
  marginTop: 4,
  marginBottom: 12,
},

submitReportButton: {
  backgroundColor: '#287A3D',
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
},

submitReportText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 15,
},

});