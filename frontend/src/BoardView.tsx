import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { io } from 'socket.io-client';
import api from './api';
import { Plus, Trash2, Edit2, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

import ChatSidebar from './components/ChatSidebar';
import BoardHeader from './components/BoardHeader'; 

// Socket setup
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';
const socket = io(SOCKET_URL); 

// Helper to grab user from local storage
const getMyUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user || payload; 
  } catch(e) { return null; }
};

const isTaskOverdue = (dueDateStr: string, status: string) => {
  if (status === 'completed' || !dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  return dueDate < today;
};

export default function BoardView() {
  const { boardId } = useParams();
  
  // ⚡ FIX: useMemo stops the Infinite Loop! 
  // Before, getMyUser() ran every render, creating a new object and triggering useEffect.
  const myUser = useMemo(() => getMyUser(), []);
  const myUserId = myUser?.id || myUser?._id;
  const userInitials = useMemo(() => 
    myUser?.username ? myUser.username.substring(0, 2).toUpperCase() : 'ME', 
    [myUser]
  );

  const [boardDetails, setBoardDetails] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer');
  const [lists, setLists] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals for Lists & Cards
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardUrgency, setNewCardUrgency] = useState('medium');
  const [newCardDueDate, setNewCardDueDate] = useState('');

  const [showListModal, setShowListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [listToEdit, setListToEdit] = useState<any | null>(null);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  // Chat & Notification State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<{id: string, message: string, time: Date}[]>([]);

  const isAdminOrOwner = useMemo(() => 
    currentUserRole === 'admin' || currentUserRole === 'owner', 
    [currentUserRole]
  );

  // ⚡ THE FIX: Defensive checks to prevent the Render 404/HTML string loop
  const fetchBoardData = useCallback(async () => {
    if (!boardId) return;
    try {
      const boardsRes = await api.get('/boards');
      const boardsData = Array.isArray(boardsRes.data) ? boardsRes.data : [];
      const currentBoard = boardsData.find((b: any) => b._id === boardId);
      
      if (currentBoard) {
        setBoardDetails(currentBoard);
        const myMembership = currentBoard.members.find((m: any) => {
          const mId = typeof m.user === 'object' ? m.user._id : m.user;
          return mId === myUserId;
        });
        if (myMembership) setCurrentUserRole(myMembership.role);
      }

      const listsRes = await api.get(`/lists/${boardId}`);
      const listsData = Array.isArray(listsRes.data) ? listsRes.data : [];
      setLists(listsData);
      
      const allCards = [];
      for (const list of listsData) {
         const cardsRes = await api.get(`/cards/${list._id}`);
         if (Array.isArray(cardsRes.data)) {
            allCards.push(...cardsRes.data);
         }
      }
      setCards(allCards.sort((a, b) => (a.position || 0) - (b.position || 0)));
    } catch (error) {
      console.error("Board Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [boardId, myUserId]);

  useEffect(() => {
    fetchBoardData();
    socket.emit('join_board', boardId);
    
    socket.on('update_board', () => { fetchBoardData(); });
    socket.on('receive_notification', (data) => {
      setNotifications(prev => [
        { id: Date.now().toString(), message: data.message, time: new Date() },
        ...prev
      ]);
      setUnreadCount(prev => prev + 1);
    });

    return () => { 
      socket.off('update_board'); 
      socket.off('receive_notification');
    };
  }, [boardId, fetchBoardData]);

  const triggerNotification = (message: string) => {
    socket.emit('send_notification', { roomId: boardId, message });
    notifyOthers();
  };

  const notifyOthers = () => socket.emit('board_changed', boardId);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/'; 
  };

  // --- ACTIONS ---
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      const res = await api.post('/lists', { title: newListTitle, boardId });
      setLists([...lists, res.data]);
      setShowListModal(false); setNewListTitle(''); 
      triggerNotification(`${myUser?.username} created a new list: "${newListTitle}"`);
    } catch (error) { console.error(error); }
  };

  const handleEditList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listToEdit || !listToEdit.title.trim()) return;
    try {
      const res = await api.put(`/lists/${listToEdit._id}`, { title: listToEdit.title });
      setLists(lists.map(l => l._id === listToEdit._id ? res.data : l));
      setListToEdit(null); 
      triggerNotification(`${myUser?.username} renamed a list.`);
    } catch (error) { console.error(error); }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await api.delete(`/lists/${listToDelete}`);
      setLists(lists.filter(l => l._id !== listToDelete));
      setCards(cards.filter(c => c.listId !== listToDelete));
      setListToDelete(null); 
      triggerNotification(`${myUser?.username} deleted a list.`);
    } catch (error) { console.error(error); }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !activeListId || !newCardDueDate) return;
    try {
      const res = await api.post('/cards', { 
        title: newCardTitle, listId: activeListId, urgency: newCardUrgency, dueDate: newCardDueDate
      });
      setCards([...cards, res.data]);
      setShowCardModal(false); setNewCardTitle(''); setNewCardDueDate('');
      triggerNotification(`${myUser?.username} created task: "${res.data.title}"`);
    } catch (error) { console.error(error); }
  };

  const handleUpdateCardDetails = async () => {
    if (!selectedCard) return;
    try {
      const res = await api.put(`/cards/${selectedCard._id}`, selectedCard);
      setCards(cards.map(c => c._id === selectedCard._id ? res.data : c));
      triggerNotification(`${myUser?.username} updated task: "${selectedCard.title}"`);
      setSelectedCard(null); 
    } catch (error) { console.error(error); }
  };

  const confirmDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      await api.delete(`/cards/${cardToDelete}`);
      setCards(cards.filter(c => c._id !== cardToDelete));
      setCardToDelete(null); 
      triggerNotification(`${myUser?.username} deleted a task.`);
    } catch (error) { console.error(error); }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const movedCard = cards.find(c => c._id === draggableId);
    if (!movedCard) return;

    let otherCards = cards.filter(c => c.listId !== source.droppableId && c.listId !== destination.droppableId);
    let sourceListCards = cards.filter(c => c.listId === source.droppableId && c._id !== draggableId);
    const updatedMovedCard = { ...movedCard, listId: destination.droppableId };
    let destinationListCards = source.droppableId === destination.droppableId 
        ? [...sourceListCards] : cards.filter(c => c.listId === destination.droppableId);
        
    destinationListCards.splice(destination.index, 0, updatedMovedCard);
    destinationListCards = destinationListCards.map((c, i) => ({ ...c, position: i }));

    const newCards = [...otherCards, ...destinationListCards, ...(source.droppableId !== destination.droppableId ? sourceListCards : [])];
    setCards(newCards);

    try { 
        const updatedItems = destinationListCards.map(c => ({ _id: c._id, position: c.position, listId: c.listId }));
        await api.put('/cards/reorder', { items: updatedItems }); 
        triggerNotification(`${myUser?.username} moved a task.`);
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="p-8 text-gray-600 font-medium flex items-center justify-center h-screen bg-blue-50/20">Loading SyncSpace...</div>;

  return (
    <div className="min-h-screen bg-blue-50/30 p-8 relative overflow-x-hidden">
      
      <ChatSidebar 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        boardId={boardId || ''} 
        socket={socket} 
        myUserId={myUserId} 
      />

      <BoardHeader 
        boardId={boardId || ''}
        boardDetails={boardDetails}
        currentUserRole={currentUserRole}
        myUser={myUser}
        myUserId={myUserId}
        userInitials={userInitials}
        isAdminOrOwner={isAdminOrOwner}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
        notifications={notifications}
        setNotifications={setNotifications}
        setIsChatOpen={setIsChatOpen}
        fetchBoardData={fetchBoardData}
        triggerNotification={triggerNotification}
        handleLogout={handleLogout}
      />

      {/* --- DRAG & DROP BOARD --- */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 items-start h-[calc(100vh-150px)]">
          {lists.map(list => (
            <div key={list._id} className="bg-gray-100 rounded-xl w-80 shrink-0 p-4 border border-gray-200 shadow-sm max-h-full flex flex-col">
              
              <div className="flex justify-between items-center mb-4 px-1 group">
                <h3 className="font-semibold text-gray-700">{list.title}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setListToEdit(list)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Edit2 className="h-4 w-4"/></button>
                   <button onClick={() => setListToDelete(list._id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-4 w-4"/></button>
                </div>
              </div>
              
              <Droppable droppableId={list._id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3 min-h-[50px] overflow-y-auto">
                    {cards.filter(card => card.listId === list._id).map((card, index) => {
                      const isOverdue = isTaskOverdue(card.dueDate, card.status);
                      const cardBgClass = isOverdue 
                        ? 'bg-red-50 border-red-300 shadow-red-100' 
                        : (card.color || 'bg-white hover:border-blue-300');

                      return (
                        <Draggable key={card._id} draggableId={card._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              onClick={() => setSelectedCard(card)}
                              className={`p-3 rounded-lg shadow-sm border group relative transition-all ${cardBgClass} ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 border-blue-400' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <p className={`text-sm font-medium pr-6 ${card.status === 'completed' ? 'text-gray-400 line-through' : (isOverdue ? 'text-red-900' : 'text-gray-800')}`}>
                                  {card.title}
                                </p>
                                {card.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 absolute top-3 right-3" />}
                                {isOverdue && !card.status && <AlertCircle className="h-4 w-4 text-red-500 shrink-0 absolute top-3 right-3" />}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
                                    card.urgency === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    card.urgency === 'low' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                  {card.urgency || 'Medium'}
                                </span>
                                {card.dueDate && (
                                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${isOverdue ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    <Clock className="h-3 w-3" />
                                    {new Date(card.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>

                              <button 
                                onClick={(e) => { e.stopPropagation(); setCardToDelete(card._id); }} 
                                className={`absolute top-2 right-2 p-1 rounded bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-600 ${card.status === 'completed' ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              
              <button onClick={() => { setActiveListId(list._id); setShowCardModal(true); }} className="text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-md transition-colors flex items-center gap-1 mt-3 w-full font-medium">
                <Plus className="h-4 w-4" /> Add a task
              </button>
            </div>
          ))}
          
          <div className="w-80 shrink-0">
            <button onClick={() => setShowListModal(true)} className="w-full bg-white/50 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl p-4 flex items-center justify-center gap-2 font-medium hover:bg-white transition-all shadow-sm">
              <Plus className="h-5 w-5" /> Add another list
            </button>
          </div>
        </div>
      </DragDropContext>

      {/* --- ALL MODALS (List Create, Rename, Delete, Card Create, Card Edit, Card Delete) --- */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Create New List</h3>
              <button onClick={() => setShowListModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleAddList} className="p-6">
              <input type="text" autoFocus placeholder="e.g., In Progress" value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none mb-6" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowListModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Add List</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {listToEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Rename List</h3>
              <button onClick={() => setListToEdit(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleEditList} className="p-6">
              <input type="text" autoFocus value={listToEdit.title} onChange={(e) => setListToEdit({...listToEdit, title: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none mb-6" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setListToEdit(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {listToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete List?</h3>
              <p className="text-gray-500 mb-6">This will delete the list and all tasks inside it forever.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setListToDelete(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleDeleteList} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">Create New Task</h3>
              <button onClick={() => setShowCardModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleAddCard} className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
              <input type="text" required autoFocus placeholder="What needs to be done?" value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
              <div className="flex gap-4 mb-6">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input type="date" required value={newCardDueDate} onChange={(e) => setNewCardDueDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority <span className="text-red-500">*</span></label>
                  <select value={newCardUrgency} onChange={(e) => setNewCardUrgency(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setShowCardModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <input type="text" value={selectedCard.title} onChange={(e) => setSelectedCard({...selectedCard, title: e.target.value})} className={`text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 w-[90%] outline-none ${selectedCard.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`} />
              <button onClick={() => setSelectedCard(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5"/></button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                  <select value={selectedCard.status || 'pending'} onChange={(e) => setSelectedCard({...selectedCard, status: e.target.value})} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                    <option value="pending">⏳ Pending</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Urgency</label>
                  <select value={selectedCard.urgency || 'medium'} onChange={(e) => setSelectedCard({...selectedCard, urgency: e.target.value})} className={`w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium`}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Due Date</label>
                  <input type="date" value={selectedCard.dueDate ? selectedCard.dueDate.split('T')[0] : ''} onChange={(e) => setSelectedCard({...selectedCard, dueDate: e.target.value})} className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 flex items-center gap-2 mb-2"><Edit2 className="h-4 w-4"/> Description</label>
                <textarea rows={4} placeholder="Add a detailed description..." value={selectedCard.description || ""} onChange={(e) => setSelectedCard({...selectedCard, description: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={handleUpdateCardDetails} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors">Save Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Task?</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to permanently delete this task?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setCardToDelete(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={confirmDeleteCard} className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors shadow-sm">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}