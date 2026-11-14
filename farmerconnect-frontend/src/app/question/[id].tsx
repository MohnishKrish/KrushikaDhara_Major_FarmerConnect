import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

// ---------------- API CONFIGURATION ----------------

const API_URL = 'http://172.51.137.206:5000/api';

// ---------------- TYPES ----------------

type QuestionType = {
  _id: string;
  title: string;
  description: string;
  crop?: string;
  district?: string;
  images?: {
    url: string;
    public_id?: string;
  }[];
  askedBy?: {
    _id: string;
    name: string;
    district: string;
  };
  createdAt?: string;
};

type AnswerType = {
  _id: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  isUpvoted: boolean;
  createdAt: string;
  answeredBy: {
    _id: string;
    name: string;
    district: string;
  };
};

// ---------------- MAIN SCREEN ----------------

export default function QuestionDetailsScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [question, setQuestion] = useState<QuestionType | null>(null);

  const [answers, setAnswers] = useState<AnswerType[]>([]);

  const [answerText, setAnswerText] = useState('');

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [token, setToken] = useState('');

  const [currentUserId, setCurrentUserId] = useState('');

  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null);

  // ---------------- SORTING STATE ----------------

  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  // ---------------- EDIT ANSWER STATE ----------------

  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);

  const [editAnswerText, setEditAnswerText] = useState('');

  const [savingEdit, setSavingEdit] = useState(false);

  // ---------------- DELETE ANSWER STATE ----------------

  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null);

  // ---------------- REPORT ANSWER STATE ----------------

const [reportModalVisible, setReportModalVisible] = useState(false);

const [reportAnswerId, setReportAnswerId] = useState('');

const [reportReason, setReportReason] = useState('');

const [reportDescription, setReportDescription] = useState('');

const [reportSubmitting, setReportSubmitting] = useState(false);

const [reportMenuAnswerId, setReportMenuAnswerId] = useState<string | null>(null);

const reportReasons = [
  'Spam',
  'Harassment',
  'Misinformation',
  'Inappropriate Content',
  'Irrelevant Content',
  'Other',
];

  // ---------------- SORT ANSWERS ----------------

  const sortedAnswers = useMemo(() => {
    const sorted = [...answers];

    if (sortBy === 'popular') {
      return sorted.sort((a, b) => {
        const difference =
          (b.upvotes || 0) - (a.upvotes || 0);

        if (difference !== 0) {
          return difference;
        }

        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      });
    }

    return sorted.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [answers, sortBy]);

  // ---------------- SAFE BACK NAVIGATION ----------------

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // ---------------- LOAD QUESTION ----------------

  const fetchQuestion = useCallback(async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');

      if (!authToken) {
        Alert.alert('Login Required', 'Please log in again.');
        return;
      }

      setToken(authToken);

      const response = await fetch(
        `${API_URL}/questions/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load question.');
      }

      if (data.success) {
        setQuestion(data.question || data);
      }

    } catch (error: any) {
      console.log('Fetch Question Error:', error);

      Alert.alert(
        'Error',
        error.message || 'Unable to load question.'
      );
    }
  }, [id]);

  // ---------------- FETCH ANSWERS ----------------

  const fetchAnswers = useCallback(async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');

      if (!authToken) {
        return;
      }

      setToken(authToken);

      const savedProfile = await AsyncStorage.getItem('farmerProfile');

      const userProfile = savedProfile
        ? JSON.parse(savedProfile)
        : null;

      const userId = userProfile?._id || userProfile?.id || '';

      setCurrentUserId(String(userId));

      console.log('CURRENT USER ID:', userId);

      const response = await fetch(
        `${API_URL}/answers/question/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load answers.');
      }

      if (data.success && Array.isArray(data.answers)) {
        const updatedAnswers = data.answers.map(
          (answer: AnswerType) => ({
            ...answer,
            isUpvoted: Array.isArray(answer.upvotedBy)
              ? answer.upvotedBy.some(
                  (upvotedUserId: any) =>
                    String(
                      upvotedUserId?._id || upvotedUserId
                    ) === String(userId)
                )
              : false,
          })
        );

        setAnswers(updatedAnswers);
      }

    } catch (error) {
      console.log('Fetch Answers Error:', error);
    }
  }, [id]);

  // ---------------- INITIAL LOAD ----------------

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchQuestion(),
        fetchAnswers(),
      ]);

      setLoading(false);
    };

    loadData();
  }, [fetchQuestion, fetchAnswers]);

  // ---------------- SUBMIT ANSWER ----------------

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      Alert.alert('Empty Answer', 'Please enter your answer.');
      return;
    }

    if (!token) {
      Alert.alert('Login Required', 'Please log in again.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/answers/question/${id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            content: answerText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit answer.');
      }

      if (data.success) {
        setAnswerText('');

        await fetchAnswers();

        Alert.alert(
          'Success',
          'Your answer has been posted successfully!'
        );
      }

    } catch (error: any) {
      console.log('Submit Answer Error:', error);

      Alert.alert(
        'Error',
        error.message || 'Unable to submit your answer.'
      );

    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- START EDITING ANSWER ----------------

  const handleEditAnswer = (answer: AnswerType) => {
    setEditingAnswerId(answer._id);
    setEditAnswerText(answer.content);
  };

  // ---------------- CANCEL EDITING ----------------

  const handleCancelEdit = () => {
    setEditingAnswerId(null);
    setEditAnswerText('');
  };

  // ---------------- UPDATE ANSWER ----------------

  const handleUpdateAnswer = async () => {
    if (!editAnswerText.trim()) {
      Alert.alert('Empty Answer', 'Answer cannot be empty.');
      return;
    }

    if (!editingAnswerId || !token) {
      Alert.alert('Error', 'Unable to identify the answer.');
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(
        `${API_URL}/answers/question/${id}/${editingAnswerId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            content: editAnswerText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update answer.');
      }

      setEditingAnswerId(null);
      setEditAnswerText('');

      await fetchAnswers();

      Alert.alert(
        'Success',
        'Your answer has been updated successfully!'
      );

    } catch (error: any) {
      console.log('Update Answer Error:', error);

      Alert.alert(
        'Error',
        error.message || 'Unable to update answer.'
      );

    } finally {
      setSavingEdit(false);
    }
  };

  // ---------------- DELETE ANSWER ----------------

const handleDeleteAnswer = async (answerId: string) => {

  // WEB CONFIRMATION
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(
      'Are you sure you want to delete this answer?'
    );

    if (confirmed) {
      await deleteAnswerRequest(answerId);
    }

    return;
  }

  // ANDROID / IOS CONFIRMATION
  Alert.alert(
    'Delete Answer',
    'Are you sure you want to delete this answer?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAnswerRequest(answerId),
      },
    ]
  );
};

// ---------------- DELETE API REQUEST ----------------

const deleteAnswerRequest = async (answerId: string) => {
  try {
    setDeletingAnswerId(answerId);

    const response = await fetch(
      `${API_URL}/answers/question/${id}/${answerId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || 'Unable to delete answer.'
      );
    }

    if (editingAnswerId === answerId) {
      handleCancelEdit();
    }

    await fetchAnswers();

    if (Platform.OS === 'web') {
      window.alert('Answer deleted successfully!');
    } else {
      Alert.alert('Success', 'Answer deleted successfully!');
    }

  } catch (error: any) {
    console.log('Delete Answer Error:', error);

    if (Platform.OS === 'web') {
      window.alert(
        error.message || 'Unable to delete answer.'
      );
    } else {
      Alert.alert(
        'Error',
        error.message || 'Unable to delete answer.'
      );
    }

  } finally {
    setDeletingAnswerId(null);
  }
};

// ---------------- OPEN REPORT MODAL ----------------

const openReportModal = (answerId: string) => {
  setReportAnswerId(answerId);
  setReportReason('');
  setReportDescription('');
  setReportMenuAnswerId(null);
  setReportModalVisible(true);
};

// ---------------- SUBMIT ANSWER REPORT ----------------

const handleSubmitReport = async () => {
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  if (!reportReason) {
    showMessage('Select a reason', 'Please select a reason for reporting.');
    return;
  }

  if (!reportAnswerId) {
    showMessage('Error', 'Answer ID is missing.');
    return;
  }

  try {
    setReportSubmitting(true);

    const authToken = token || await AsyncStorage.getItem('authToken');

    if (!authToken) {
      throw new Error('Please log in again.');
    }

    const response = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        contentType: 'Answer',
        contentId: reportAnswerId,
        reason: reportReason,
        description: reportDescription.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to submit report.');
    }

    setReportModalVisible(false);
    setReportAnswerId('');
    setReportReason('');
    setReportDescription('');

    showMessage(
      'Report Submitted',
      'Thank you for helping keep FarmerConnect safe.'
    );

  } catch (error: any) {
    showMessage(
      'Report Failed',
      error.message || 'Something went wrong.'
    );

  } finally {
    setReportSubmitting(false);
  }
};

  // ---------------- ANSWER UPVOTE ----------------

  const handleAnswerUpvote = async (answerId: string) => {
    if (!token || !currentUserId) {
      Alert.alert(
        'Login Required',
        'Unable to identify your account. Please log in again.'
      );
      return;
    }

    if (votingAnswerId) {
      return;
    }

    const answer = answers.find(
      item => item._id === answerId
    );

    if (!answer) return;

    // Prevent users from upvoting their own answers

    const isOwnAnswer =
      String(currentUserId) === String(answer.answeredBy?._id);

    if (isOwnAnswer) {
      return;
    }

    const method = answer.isUpvoted ? 'DELETE' : 'PUT';

    // Optimistic UI update

    setAnswers(previous =>
      previous.map(item =>
        item._id === answerId
          ? {
              ...item,
              isUpvoted: !item.isUpvoted,
              upvotes: item.isUpvoted
                ? Math.max(0, item.upvotes - 1)
                : item.upvotes + 1,
            }
          : item
      )
    );

    setVotingAnswerId(answerId);

    try {
      const response = await fetch(
        `${API_URL}/answers/question/${id}/${answerId}/upvote`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update upvote.');
      }

      await fetchAnswers();

    } catch (error: any) {
      console.log('Answer Upvote Error:', error);

      await fetchAnswers();

      Alert.alert(
        'Error',
        error.message || 'Unable to update upvote.'
      );

    } finally {
      setVotingAnswerId(null);
    }
  };

  // ---------------- LOADING SCREEN ----------------

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#287A3D" />

        <Text style={styles.loadingText}>
          Loading question...
        </Text>
      </SafeAreaView>
    );
  }

  // ---------------- QUESTION NOT FOUND ----------------

  if (!question) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>← Go Back</Text>
        </TouchableOpacity>

        <Text style={styles.emptyText}>
          Question not found.
        </Text>
      </SafeAreaView>
    );
  }

  // ---------------- MAIN UI ----------------

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Question Details
        </Text>

        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* QUESTION CARD */}

          <View style={styles.questionCard}>

            <Text style={styles.badge}>
              ? FARMER QUESTION
            </Text>

            <Text style={styles.questionTitle}>
              {question.title}
            </Text>

            <Text style={styles.questionDescription}>
              {question.description}
            </Text>

            {/* QUESTION IMAGES */}

            {question.images && question.images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {question.images.map((image, index) => (
                  <Image
                    key={image.public_id || `${image.url}-${index}`}
                    source={{ uri: image.url }}
                    style={styles.questionImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}

            {/* QUESTION AUTHOR */}

            <View style={styles.authorContainer}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 20 }}>👨🏽</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>
                  {question.askedBy?.name || 'Farmer'}
                </Text>

                <Text style={styles.authorDistrict}>
                  {question.district ||
                    question.askedBy?.district ||
                    ''}
                  {question.crop ? ` · ${question.crop}` : ''}
                </Text>
              </View>
            </View>

          </View>

          {/* ANSWERS SECTION */}

          <View style={styles.answersHeader}>
            <Text style={styles.sectionTitle}>
              Answers ({answers.length})
            </Text>

            <TouchableOpacity onPress={fetchAnswers}>
              <Text style={styles.refreshText}>
                ↻ Refresh
              </Text>
            </TouchableOpacity>
          </View>

          {/* ANSWER SORTING */}

          <View style={styles.sortContainer}>

            <TouchableOpacity
              onPress={() => setSortBy('newest')}
              style={[
                styles.sortButton,
                sortBy === 'newest' && styles.sortButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === 'newest' && styles.sortTextActive,
                ]}
              >
                🕒 Newest First
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortBy('popular')}
              style={[
                styles.sortButton,
                sortBy === 'popular' && styles.sortButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === 'popular' && styles.sortTextActive,
                ]}
              >
                ⬆ Most Upvoted
              </Text>
            </TouchableOpacity>

          </View>

          {/* ANSWER LIST */}

          {sortedAnswers.length > 0 ? (
            sortedAnswers.map(answer => {

              // Identify answer owner

              const isOwnAnswer =
                !!currentUserId &&
                String(currentUserId) ===
                String(answer.answeredBy?._id);
                console.log('---------------------------');
console.log('CURRENT USER ID:', currentUserId);
console.log('ANSWER OWNER:', answer.answeredBy);
console.log('ANSWER OWNER ID:', answer.answeredBy?._id);
console.log('IS OWN ANSWER:', isOwnAnswer);
console.log('---------------------------');

              // Check editing state

              const isEditing =
                editingAnswerId === answer._id;

              // Check deleting state

              const isDeleting =
                deletingAnswerId === answer._id;

              return (
                <View
                  key={answer._id}
                  style={styles.answerCard}
                >

                    {/* ANSWER REPORT MENU */}

{!isOwnAnswer && (
  <View style={styles.reportMenuContainer}>

    <TouchableOpacity
      style={styles.reportMenuTrigger}
      onPress={() =>
        setReportMenuAnswerId(
          reportMenuAnswerId === answer._id
            ? null
            : answer._id
        )
      }
    >
      <Text style={styles.reportMenuIcon}>•••</Text>
    </TouchableOpacity>

    {reportMenuAnswerId === answer._id && (
      <TouchableOpacity
        style={styles.reportMenuButton}
        onPress={() => openReportModal(answer._id)}
      >
        <Text style={styles.reportMenuText}>
          ⚑ Report Answer
        </Text>
      </TouchableOpacity>
    )}

  </View>
)}

                  {/* ANSWER AUTHOR */}

                  <View style={styles.answerAuthor}>
                    <View style={styles.smallAvatar}>
                      <Text style={{ fontSize: 17 }}>👨🏽</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.authorName}>
                        {answer.answeredBy?.name || 'Farmer'}
                      </Text>

                      <Text style={styles.authorDistrict}>
                        {answer.answeredBy?.district || ''}
                      </Text>
                    </View>
                  </View>

                  {/* ANSWER CONTENT / EDIT INPUT */}

                  {isEditing ? (

                    <View>

                      <TextInput
                        value={editAnswerText}
                        onChangeText={setEditAnswerText}
                        multiline
                        textAlignVertical="top"
                        placeholder="Edit your answer..."
                        style={styles.editAnswerInput}
                      />

                      <View style={styles.editActions}>

                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={handleCancelEdit}
                          disabled={savingEdit}
                        >
                          <Text style={styles.cancelButtonText}>
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.saveButton,
                            savingEdit && { opacity: 0.6 },
                          ]}
                          onPress={handleUpdateAnswer}
                          disabled={savingEdit}
                        >
                          {savingEdit ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <Text style={styles.saveButtonText}>
                              ✓ Save Changes
                            </Text>
                          )}
                        </TouchableOpacity>

                      </View>

                    </View>

                  ) : (

                    <Text style={styles.answerContent}>
                      {answer.content}
                    </Text>

                  )}

                  {/* OWNER ACTIONS */}

                  {isOwnAnswer && !isEditing && (

                    <View style={styles.ownerActions}>

                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAnswer(answer)}
                        disabled={isDeleting || savingEdit}
                      >
                        <Text style={styles.editButtonText}>
                          ✏️ Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
  style={styles.deleteButton}
  onPress={() => handleDeleteAnswer(answer._id)}
  disabled={isDeleting || savingEdit}
>
  {isDeleting ? (
    <ActivityIndicator color="#C62828" size="small" />
  ) : (
    <Text style={styles.deleteButtonText}>
      🗑 Delete
    </Text>
  )}
</TouchableOpacity>

                    </View>

                  )}

                  {/* ANSWER FOOTER */}

                  <View style={styles.answerFooter}>

                    {isOwnAnswer ? (

                      <Text style={styles.answerVotes}>
                        ⬆ {answer.upvotes || 0} Upvotes
                      </Text>

                    ) : (

                      <TouchableOpacity
                        onPress={() => handleAnswerUpvote(answer._id)}
                        disabled={votingAnswerId !== null || isEditing}
                        style={[
                          styles.answerVoteButton,
                          answer.isUpvoted && styles.answerVoteActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.answerVotes,
                            answer.isUpvoted && styles.answerVoteTextActive,
                          ]}
                        >
                          ⬆ {answer.upvotes || 0} Upvotes
                        </Text>
                      </TouchableOpacity>

                    )}

                    <Text style={styles.answerDate}>
                      {new Date(answer.createdAt).toLocaleDateString()}
                    </Text>

                  </View>

                </View>
              );
            })
          ) : (
            <View style={styles.emptyAnswers}>
              <Text style={styles.emptyEmoji}>🌱</Text>

              <Text style={styles.emptyTitle}>
                No answers yet
              </Text>

              <Text style={styles.emptyText}>
                Be the first farmer to share your knowledge!
              </Text>
            </View>
          )}

        </ScrollView>

        {/* WRITE ANSWER */}

        <View style={styles.inputSection}>

          <Text style={styles.inputHeading}>
            Share your knowledge
          </Text>

          <TextInput
            value={answerText}
            onChangeText={setAnswerText}
            placeholder="Write your answer here..."
            multiline
            textAlignVertical="top"
            style={styles.answerInput}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && { opacity: 0.6 },
            ]}
            onPress={handleSubmitAnswer}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                ➤ Post Answer
              </Text>
            )}
          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>
       {/* REPORT ANSWER MODAL */}

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

            <Text style={styles.reportHeading}>

              ⚑ Report Answer

            </Text>

            <Text style={styles.reportSubtitle}>

              Why are you reporting this answer?

            </Text>

            {/* REPORT REASONS */}

            <View style={styles.reportReasonsContainer}>

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

                    {reason}

                  </Text>

                </TouchableOpacity>

              ))}

            </View>

            {/* DESCRIPTION */}

            <TextInput

              value={reportDescription}

              onChangeText={setReportDescription}

              placeholder="Additional details (optional)..."

              multiline

              maxLength={500}

              textAlignVertical="top"

              style={styles.reportDescriptionInput}

            />

            <Text style={styles.reportCharacterCount}>

              {reportDescription.length}/500

            </Text>

            {/* ACTION BUTTONS */}

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

            <TouchableOpacity

              style={styles.cancelReportButton}

              onPress={() => setReportModalVisible(false)}

              disabled={reportSubmitting}

            >

              <Text style={styles.cancelReportText}>

                Cancel

              </Text>

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
    backgroundColor: '#F4F8F1',
  },

  loadingText: {
    marginTop: 12,
    color: '#66816A',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#E5EBE1',
  },

  backButton: {
    fontSize: 25,
    color: '#287A3D',
    fontWeight: 'bold',
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#243B29',
  },

  scrollContent: {
    padding: 15,
    paddingBottom: 25,
  },

  questionCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5EBE1',
  },

  badge: {
    color: '#287A3D',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 15,
  },

  questionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#243B29',
    marginBottom: 12,
  },

  questionDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: '#48544A',
  },

  imagesContainer: {
    marginTop: 15,
  },

  questionImage: {
    width: 250,
    height: 180,
    borderRadius: 12,
    marginRight: 10,
  },

  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EDF0EA',
    marginTop: 18,
    paddingTop: 15,
  },

  avatar: {
    width: 42,
    height: 42,
    backgroundColor: '#E6F0E1',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  authorName: {
    fontWeight: 'bold',
    color: '#26382A',
    fontSize: 14,
  },

  authorDistrict: {
    color: '#788679',
    fontSize: 12,
    marginTop: 4,
  },

  answersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#243B29',
  },

  refreshText: {
    color: '#287A3D',
    fontWeight: 'bold',
  },

  // ---------------- SORTING STYLES ----------------

  sortContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },

  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DCE9D7',
  },

  sortButtonActive: {
    backgroundColor: '#287A3D',
    borderColor: '#287A3D',
  },

  sortText: {
    color: '#66816A',
    fontSize: 12,
    fontWeight: '600',
  },

  sortTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },

  // ---------------- ANSWER CARD ----------------

  answerCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E5EBE1',
  },

  answerAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#E6F0E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  answerContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#354039',
  },

  // ---------------- EDIT ANSWER STYLES ----------------

  editAnswerInput: {
    backgroundColor: '#F4F8F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE9D7',
    padding: 13,
    minHeight: 100,
    fontSize: 14,
    color: '#354039',
    marginBottom: 12,
  },

  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  cancelButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  cancelButtonText: {
    color: '#555555',
    fontWeight: '600',
    fontSize: 12,
  },

  saveButton: {
    backgroundColor: '#287A3D',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },

  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // ---------------- OWNER ACTIONS ----------------

  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
  },

  editButton: {
    backgroundColor: '#EFF7EB',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
  },

  editButtonText: {
    color: '#287A3D',
    fontSize: 12,
    fontWeight: 'bold',
  },

  deleteButton: {
    backgroundColor: '#FFF0EF',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 85,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // ---------------- ANSWER FOOTER ----------------

  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#EDF0EA',
  },

  answerVoteButton: {
    backgroundColor: '#EFF7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },

  answerVoteActive: {
    backgroundColor: '#D6EDD0',
  },

  answerVotes: {
    color: '#287A3D',
    fontWeight: '600',
    fontSize: 12,
  },

  answerVoteTextActive: {
    color: '#155D2A',
    fontWeight: 'bold',
  },

  answerDate: {
    color: '#899489',
    fontSize: 12,
  },

  // ---------------- EMPTY ANSWERS ----------------

  emptyAnswers: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyEmoji: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#243B29',
    marginBottom: 6,
  },

  emptyText: {
    color: '#788679',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ---------------- INPUT SECTION ----------------

  inputSection: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#E5EBE1',
  },

  inputHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#243B29',
    marginBottom: 10,
  },

  answerInput: {
    backgroundColor: '#F4F8F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE9D7',
    padding: 13,
    height: 85,
    fontSize: 14,
    marginBottom: 12,
  },

  submitButton: {
    backgroundColor: '#287A3D',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  submitButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // ---------------- REPORT ANSWER STYLES ----------------

reportMenuContainer: {
  alignItems: 'flex-end',
  position: 'relative',
  zIndex: 10,
},

reportMenuTrigger: {
  paddingHorizontal: 8,
  paddingVertical: 4,
},

reportMenuIcon: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#66816A',
},

reportMenuButton: {
  backgroundColor: 'white',
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#E5EBE1',
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
},

reportMenuText: {
  color: '#C62828',
  fontSize: 13,
  fontWeight: '600',
},
// ---------------- REPORT MODAL STYLES ----------------

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

reportModal: {
  width: '100%',
  maxWidth: 450,
  backgroundColor: 'white',
  borderRadius: 18,
  padding: 20,
},

reportHeading: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#243B29',
  marginBottom: 8,
},

reportSubtitle: {
  fontSize: 14,
  color: '#788679',
  marginBottom: 18,
},

reportReasonsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 18,
},

reportReason: {
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 20,
  backgroundColor: '#F4F8F1',
  borderWidth: 1,
  borderColor: '#DCE9D7',
},

selectedReportReason: {
  backgroundColor: '#287A3D',
  borderColor: '#287A3D',
},

reportReasonText: {
  color: '#526653',
  fontSize: 12,
  fontWeight: '600',
},

selectedReportReasonText: {
  color: 'white',
},

reportDescriptionInput: {
  backgroundColor: '#F4F8F1',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#DCE9D7',
  padding: 12,
  minHeight: 90,
  fontSize: 14,
  color: '#354039',
},

reportCharacterCount: {
  textAlign: 'right',
  color: '#899489',
  fontSize: 11,
  marginTop: 5,
  marginBottom: 15,
},

submitReportButton: {
  backgroundColor: '#287A3D',
  padding: 14,
  borderRadius: 12,
  alignItems: 'center',
},

submitReportText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
},

cancelReportButton: {
  padding: 12,
  alignItems: 'center',
  marginTop: 5,
},

cancelReportText: {
  color: '#788679',
  fontWeight: '600',
},

});