import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword,
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, UserCredential} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    registerWithEmail: (username: string, email: string, password: string) => Promise<UserCredential>;
    signInWithGoogle: () => Promise<UserCredential>;
    login: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const registerWithEmail = async (username: string, email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                username
            });
            return userCredential;
        } catch (error) {
            console.log("Error registering with email: ", error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                username: user.displayName?.replace(/\s+/g, '') || `user${Math.floor(Math.random() * 1000)}`,
            }, { merge: true });
            return userCredential;
        } catch (error) {
            console.log("Error registering with Google: ", error);
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password)
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        registerWithEmail,
        signInWithGoogle,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}