import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, joinWorkspace, leaveWorkspace } = useSocket();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/workspaces');
      if (res.data.success) {
        const list = res.data.workspaces || [];
        setWorkspaces(list);

        const savedWsId = localStorage.getItem('syncboard_active_workspace');
        const matched = list.find((w) => w._id === savedWsId);

        if (matched) {
          setCurrentWorkspace(matched);
        } else if (list.length > 0) {
          setCurrentWorkspace(list[0]);
          localStorage.setItem('syncboard_active_workspace', list[0]._id);
        } else {
          setCurrentWorkspace(null);
        }
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Subscribe to real-time events for the active workspace
  useEffect(() => {
    if (!currentWorkspace || !socket) return;

    joinWorkspace(currentWorkspace._id);

    const handleWorkspaceUpdated = (updated) => {
      if (updated._id === currentWorkspace._id) {
        setCurrentWorkspace(updated);
      }
      setWorkspaces((prev) => prev.map((w) => (w._id === updated._id ? updated : w)));
    };

    const handleMemberJoined = ({ workspaceId, user: newUser, role }) => {
      if (currentWorkspace._id === workspaceId) {
        setCurrentWorkspace((prev) => {
          if (!prev) return prev;
          const exists = prev.members.some((m) => m.user?._id === newUser.id);
          if (exists) return prev;
          return {
            ...prev,
            members: [...prev.members, { user: newUser, role }]
          };
        });
        toast.success(`${newUser.name} joined the workspace!`);
      }
    };

    const handleMemberRemoved = ({ workspaceId, userId }) => {
      if (currentWorkspace._id === workspaceId) {
        if (user?._id === userId) {
          toast.error('You were removed from this workspace');
          fetchWorkspaces();
        } else {
          setCurrentWorkspace((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              members: prev.members.filter((m) => (m.user?._id || m.user) !== userId)
            };
          });
        }
      }
    };

    socket.on('workspace:updated', handleWorkspaceUpdated);
    socket.on('workspace:member_joined', handleMemberJoined);
    socket.on('workspace:member_removed', handleMemberRemoved);

    return () => {
      leaveWorkspace(currentWorkspace._id);
      socket.off('workspace:updated', handleWorkspaceUpdated);
      socket.off('workspace:member_joined', handleMemberJoined);
      socket.off('workspace:member_removed', handleMemberRemoved);
    };
  }, [currentWorkspace?._id, socket, joinWorkspace, leaveWorkspace, fetchWorkspaces, user?._id]);

  const selectWorkspace = (workspaceId) => {
    const ws = workspaces.find((w) => w._id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      localStorage.setItem('syncboard_active_workspace', ws._id);
    }
  };

  const createWorkspace = async (name, description) => {
    try {
      const res = await api.post('/workspaces', { name, description });
      if (res.data.success) {
        const newWs = res.data.workspace;
        setWorkspaces((prev) => [newWs, ...prev]);
        setCurrentWorkspace(newWs);
        localStorage.setItem('syncboard_active_workspace', newWs._id);
        toast.success(`Workspace "${newWs.name}" created!`);
        return { success: true, workspace: newWs };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create workspace';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const updateWorkspace = async (id, name, description) => {
    try {
      const res = await api.put(`/workspaces/${id}`, { name, description });
      if (res.data.success) {
        const updated = res.data.workspace;
        setCurrentWorkspace(updated);
        setWorkspaces((prev) => prev.map((w) => (w._id === id ? updated : w)));
        toast.success('Workspace updated');
        return { success: true, workspace: updated };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update workspace';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const deleteWorkspace = async (id) => {
    try {
      const res = await api.delete(`/workspaces/${id}`);
      if (res.data.success) {
        toast.success('Workspace deleted');
        const remaining = workspaces.filter((w) => w._id !== id);
        setWorkspaces(remaining);
        if (remaining.length > 0) {
          setCurrentWorkspace(remaining[0]);
          localStorage.setItem('syncboard_active_workspace', remaining[0]._id);
        } else {
          setCurrentWorkspace(null);
          localStorage.removeItem('syncboard_active_workspace');
        }
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete workspace';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const isWorkspaceAdmin = () => {
    if (!currentWorkspace || !user) return false;
    if (
      currentWorkspace.owner?._id === user._id ||
      currentWorkspace.owner === user._id ||
      currentWorkspace.owner?.toString() === user._id?.toString()
    ) {
      return true;
    }
    const member = currentWorkspace.members?.find((m) => {
      const memberUserId = m.user?._id || m.user;
      return memberUserId?.toString() === user._id?.toString();
    });
    return member?.role === 'admin';
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        selectWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        fetchWorkspaces,
        isWorkspaceAdmin: isWorkspaceAdmin()
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
