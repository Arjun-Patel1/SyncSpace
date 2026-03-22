// ✅ THE FIX: Just remove 'Link'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from './api';
import { LayoutDashboard, Plus, X, LogOut, Edit2, Trash2, AlertCircle, UserCircle } from 'lucide-react';

interface Board {
  _id: string;
  title: string;
}

// ⚡ Extract user from token globally
const getMyUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user || payload; 
  } catch(e) { return null; }
};

export default function Dashboard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // ⚡ User Profile State
  const myUser = getMyUser();
  const userInitials = myUser?.username ? myUser.username.substring(0, 2).toUpperCase() : 'ME';
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data);
    } catch (error) {
      console.error("Error fetching boards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; 
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      const response = await api.post('/boards', { title: newBoardTitle });
      setBoards([...boards, response.data]);
      setShowCreateModal(false);
      setNewBoardTitle('');
    } catch (error) {
      alert("Failed to create board.");
    }
  };

  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardToEdit || !boardToEdit.title.trim()) return;
    try {
      const response = await api.put(`/boards/${boardToEdit._id}`, { title: boardToEdit.title });
      setBoards(boards.map(b => b._id === boardToEdit._id ? response.data : b));
      setBoardToEdit(null);
    } catch (error) {
      alert("Failed to update board.");
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    try {
      await api.delete(`/boards/${boardToDelete}`);
      setBoards(boards.filter(b => b._id !== boardToDelete));
      setBoardToDelete(null);
    } catch (error) {
      alert("Failed to delete board.");
    }
  };

  if (loading) return <div className="p-8 text-gray-600 font-medium h-screen flex items-center justify-center">Loading your workspaces...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* ⚡ NEW GLOBAL HEADER WITH AVATAR */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><LayoutDashboard className="text-white h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SyncSpace</h1>
            <p className="text-sm text-gray-500 font-medium">Welcome back, {myUser?.username || 'Creator'}!</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowProfileModal(true)} 
          className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center shadow-md hover:shadow-lg transition-all border-2 border-white ring-2 ring-gray-100"
        >
          {userInitials}
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <button onClick={() => setShowCreateModal(true)} className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-700 transition-all group">
          <Plus className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Create new board</span>
        </button>

        {boards.map(board => (
          <div key={board._id} className="h-32 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 relative group overflow-hidden flex flex-col">
            <div onClick={() => navigate(`/board/${board._id}`)} className="flex-1 p-5 cursor-pointer">
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{board.title}</h3>
            </div>
            
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); setBoardToEdit(board); }} className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 rounded-md">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setBoardToDelete(board._id); }} className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 rounded-md">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ⚡ USER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2"><UserCircle className="h-5 w-5 text-indigo-600"/> Account Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-3xl font-bold flex items-center justify-center shadow-lg mb-4 ring-4 ring-indigo-50">
                {userInitials}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{myUser?.username || "Unknown User"}</h2>
              <p className="text-gray-500 mb-6">{myUser?.email || "No email provided"}</p>
              
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors font-semibold px-4 py-3 rounded-lg border border-red-100">
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* (Your existing Edit/Delete/Create Board modals stay exactly the same down here) */}
      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Create New Board</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleCreateBoard} className="p-6">
              <input type="text" autoFocus placeholder="e.g., Q3 Marketing Plan" value={newBoardTitle} onChange={(e) => setNewBoardTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none mb-6" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">Create Board</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {boardToEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Rename Board</h3>
              <button onClick={() => setBoardToEdit(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleEditBoard} className="p-6">
              <input type="text" autoFocus value={boardToEdit.title} onChange={(e) => setBoardToEdit({...boardToEdit, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none mb-6" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setBoardToEdit(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {boardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Workspace?</h3>
              <p className="text-gray-500 mb-6">This will permanently delete the board and all tasks inside it. This action cannot be undone.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setBoardToDelete(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleDeleteBoard} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}