import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

import defaultProfileImage from '../assets/default_profile.jpg';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const token = localStorage.getItem('accessToken');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (!token) {
        console.error("No token found, please log in again.");
        return;
      }

      const response = await axios.get('http://localhost:8000/api/v1/posts/timeline', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setPosts(response.data.posts);
      } else {
        console.error('Failed to fetch posts:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleExpandPost = async (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
    
    if (expandedPost !== postId) {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/comments/${postId}/comments`);
        if (response.status === 200) {
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post._id === postId
                ? { ...post, comments: response.data.comments }
                : post
            )
          );
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/v1/posts/${postId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? { 
                  ...post, 
                  likes: post.likes.includes(token) 
                    ? post.likes.filter(id => id !== token) 
                    : [...post.likes, token] 
                }
              : post
          )
        );
      } else {
        console.error('Failed to like post:', response.statusText);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;

    try {
      const response = await axios.post(`http://localhost:8000/api/v1/comments/${postId}/comments`, {
        description: commentText,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.status === 200) {
        const newComment = response.data.post.comments.pop();

        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? { 
                  ...post, 
                  comments: [...post.comments, newComment] 
                }
              : post
          )
        );
        setCommentText(''); // Clear the comment input
      } else {
        console.error('Failed to submit comment:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', padding: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        posts.map((post) => (
          <Card 
            key={post._id} 
            sx={{ 
              marginBottom: 4, 
              overflow: 'hidden',
              transition: 'all 0.5s ease-in-out', 
              maxWidth: expandedPost === post._id ? 1200 : 600, 
              marginLeft: expandedPost === post._id ? '-25%' : 'auto', 
              marginRight: expandedPost === post._id ? '-25%' : 'auto', 
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                width: '100%',
                transition: 'all 0.5s ease-in-out', 
              }}
            >
              <Box 
                sx={{ 
                  width: expandedPost === post._id ? '50%' : '100%', 
                  flexShrink: 0,
                  transition: 'all 0.5s ease-in-out', 
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar 
                      src={post.user.profilePicture || defaultProfileImage} 
                      alt={post.user.username} 
                      sx={{ width: 40, height: 40 }}
                    />
                  }
                  title={post.user.username}
                  sx={{ pb: 1 }}
                />
                <CardMedia
                  component="img"
                  height={400}
                  image={post.imgurl || post.content.src}
                  alt="Post content"
                />
                <CardContent sx={{ pt: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconButton aria-label="like" size="small" onClick={() => handleLikePost(post._id)}>
                      <FavoriteIcon fontSize="small" sx={{ color: post.likes.includes(token) ? 'red' : 'inherit' }} />
                    </IconButton>
                    <Typography variant="body2" sx={{ mr: 2 }}>{post.likes.length}</Typography>
                    <IconButton 
                      aria-label="comment" 
                      size="small" 
                      onClick={() => handleExpandPost(post._id)}
                    >
                      <ChatBubbleOutlineIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2">{post.comments.length}</Typography>
                  </Box>
                  <Typography variant="body2">{post.caption || post.description}</Typography>
                </CardContent>
              </Box>
              {expandedPost === post._id && (
                <Box 
                  sx={{ 
                    width: '50%', 
                    height: '100%',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.5s ease-in-out', 
                  }}
                >
                  <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {post.likes.length} likes • {post.comments.length} comments
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>{post.user.username}</strong> {post.caption || post.description}
                    </Typography>
                    {post.comments.map((comment, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar src={comment.user?.profilePicture || 'person/noAvatar.png'} alt={comment.user?.username || 'User'} sx={{ width: 32, height: 32 }} />
                        <Typography variant="body2">
                          <strong>{comment.user?.username || 'Anonymous'}:</strong> {comment.description}
                        </Typography>
                      </Box>
                    ))}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        borderTop: '1px solid #e0e0e0', 
                        p: 2 
                      }}
                    >
                      <TextField
                        fullWidth
                        placeholder="Add a comment..."
                        variant="standard"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        sx={{ mr: 1 }}
                      />
                      <IconButton aria-label="send" size="small" onClick={() => handleCommentSubmit(post._id)}>
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        ))
      )}
    </Box>
  );
}
