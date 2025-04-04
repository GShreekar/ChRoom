import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, DocumentData, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';

interface RoomMember {
  uid: string;
  username: string;
}

export const useRoom = (roomId: string | undefined, userId: string | undefined, username: string) => {
  const [room, setRoom] = useState<DocumentData | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const listenerActive = useRef(false);

  const joinRoom = useCallback(async () => {
    if (!roomId || !userId || !username) return;
    
    try {
      const memberObj = { uid: userId, username };
      
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        const currentMembers = roomDoc.data().members || [];
        const isAlreadyMember = currentMembers.some(
          (m: RoomMember) => m.uid === userId && m.username === username
        );
        
        if (!isAlreadyMember) {
          const roomRef = doc(db, 'rooms', roomId);
          await updateDoc(roomRef, {
            members: arrayUnion(memberObj)
          });
        }
      }
      return true;
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
      return false;
    }
  }, [roomId, userId, username]);

  const leaveRoom = useCallback(async () => {
    if (!roomId || !userId || !username) return;
    
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        members: arrayRemove({ uid: userId, username })
      });
      return true;
    } catch (err) {
      console.error('Error leaving room:', err);
      return false;
    }
  }, [roomId, userId, username]);

  useEffect(() => {
    if (!roomId || !userId || listenerActive.current) return;
    
    setLoading(true);
    listenerActive.current = true;

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId), 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const roomData = docSnapshot.data();
          setRoom(roomData);
          setMembers(roomData.members || []);
        } else {
          setError('Room not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to room changes:', err);
        setError('Failed to load room updates');
        setLoading(false);
      }
    );
    
    return () => {
      unsubscribe();
      listenerActive.current = false;
    };
  }, [roomId, userId]);

  return { room, members, loading, error, joinRoom, leaveRoom };
};