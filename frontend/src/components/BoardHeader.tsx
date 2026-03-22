import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, ShieldAlert, MessageSquare, Users, Plus, Bell, UserCircle, X, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BoardHeaderProps {
  boardId: string;
  boardDetails: any;
  currentUserRole: string;
  myUser: any;
  myUserId: string;
  userInitials: string;
  isAdminOrOwner: boolean;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  setIsChatOpen: (isOpen: boolean) => void;
  fetchBoardData: () => void;
  triggerNotification: (msg: string) => void;
  handleLogout: () => void;
}

export default function BoardHeader({
  boardId, boardDetails, currentUserRole, myUser, myUserId, userInitials, isAdminOrOwner,
  unreadCount, setUnreadCount, notifications, setNotifications, setIsChatOpen, fetchBoardData, triggerNotification, handleLogout
}: BoardHeaderProps) {
  
  // Modals specific to the header/team management
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Invite & Kick State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteStatus, setInviteStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // --- Header Specific Logic ---
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteStatus(null); setIsInviting(true);
    try {
      await api.post(`/boards/${boardId}/members`, { email: inviteEmail, role: inviteRole });
      setInviteStatus({ type: 'success', message: `${inviteEmail} has been added!` });
      setInviteEmail(''); 
      fetchBoardData(); 
      triggerNotification(`${myUser?.username} invited a new team member.`);
    } catch (error: any) {
      setInviteStatus({ type: 'error', message: error.response?.data?.message || "Failed to invite member." });
    } finally { setIsInviting(false); }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await api.delete(`/boards/${boardId}/members/${memberToRemove}`);
      setMemberToRemove(null);
      fetchBoardData();
      triggerNotification(`${myUser?.username} removed a team member.`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to remove user.");
    }
  };

  return (
    <>
      {/* --- ACTUAL NAVIGATION BAR --- */}
      <div className="flex justify-between items-center mb-8 w-full relative z-30">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex gap-3 items-center">
          <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider mr-2">
            {currentUserRole === 'owner' && <ShieldAlert className="h-3 w-3" />}
            {currentUserRole}
          </span>
          
          <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors font-medium px-4 py-2 rounded-lg shadow-sm">
            <MessageSquare className="h-4 w-4 text-blue-600" /> Chat
          </button>

          <button onClick={() => setShowTeamModal(true)} className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors font-medium px-4 py-2 rounded-lg shadow-sm">
            <Users className="h-4 w-4" /> Team ({boardDetails?.members?.length || 1})
          </button>
          
          {isAdminOrOwner && (
            <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium px-4 py-2 rounded-lg shadow-sm">
              <Plus className="h-4 w-4" /> Share
            </button>
          )}
          
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setUnreadCount(0); }} 
              className="flex items-center justify-center h-10 w-10 ml-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors rounded-full shadow-sm relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-14 right-0 w-80 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-sm">Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Clear All</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">You're all caught up!</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm">
                        <p className="text-gray-800 font-medium">{n.message}</p>
                        <span className="text-xs text-gray-400 mt-1 block">{n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setShowProfileModal(true)} className="h-10 w-10 ml-2 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center shadow-md hover:shadow-lg transition-all border-2 border-white ring-2 ring-gray-100">
            {userInitials}
          </button>
        </div>
      </div>

      {/* --- COMPONENT MODALS --- */}
      {/* 1. Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><UserCircle className="h-5 w-5 text-indigo-600"/> Account Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-3xl font-bold flex items-center justify-center shadow-lg mb-4 ring-4 ring-indigo-50">{userInitials}</div>
              <h2 className="text-2xl font-bold text-gray-800">{myUser?.username || "Unknown User"}</h2>
              <p className="text-gray-500 mb-6">{myUser?.email || "No email provided"}</p>
              <div className="w-full bg-gray-50 rounded-lg p-3 text-sm text-gray-600 flex justify-between items-center mb-6 border border-gray-100">
                <span className="font-medium">Board Permissions:</span>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded capitalize font-bold">{currentUserRole}</span>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors font-semibold px-4 py-3 rounded-lg border border-red-100">
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="h-5 w-5 text-blue-600"/> Board Members</h3>
              <button onClick={() => setShowTeamModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {boardDetails?.members?.map((member: any) => {
                const isPopulated = typeof member.user === 'object';
                const memberId = isPopulated ? member.user._id : member.user;
                const memberName = isPopulated ? member.user.username : `User ID: ${memberId.slice(-6)}`;
                const memberEmail = isPopulated ? member.user.email : '';
                return (
                  <div key={memberId} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border-b border-gray-50 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        {memberName} {memberId === myUserId && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                      </span>
                      {memberEmail && <span className="text-xs text-gray-400">{memberEmail}</span>}
                      <span className={`text-xs font-medium capitalize mt-1 ${member.role === 'owner' ? 'text-purple-600' : member.role === 'admin' ? 'text-red-600' : 'text-gray-500'}`}>Role: {member.role}</span>
                    </div>
                    {isAdminOrOwner && member.role !== 'owner' && memberId !== myUserId && (
                      <button onClick={() => { setShowTeamModal(false); setMemberToRemove(memberId); }} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md font-medium transition-colors border border-transparent hover:border-red-200">Remove</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Invite Modal */}
      {showInviteModal && isAdminOrOwner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-blue-600"/> Invite Teammate</h3>
              <button onClick={() => { setShowInviteModal(false); setInviteStatus(null); setInviteEmail(''); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleInviteMember} className="p-6">
              {inviteStatus && (
                <div className={`mb-5 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${inviteStatus.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {inviteStatus.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  {inviteStatus.message}
                </div>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" required autoFocus placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6">
                <option value="admin">Admin (Can edit and invite others)</option>
                <option value="editor">Editor (Can create and move tasks)</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowInviteModal(false); setInviteStatus(null); setInviteEmail(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Close</button>
                <button type="submit" disabled={isInviting} className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-all ${isInviting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{isInviting ? 'Sending...' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Kick Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="h-8 w-8 text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove User?</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to remove this user from the board? They will lose all access immediately.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setMemberToRemove(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={confirmRemoveMember} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm">Yes, Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}