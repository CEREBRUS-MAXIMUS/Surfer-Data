import React, { useContext, useState, useEffect } from 'react';
import app from '../../firebase';
import Tumbler from '../animations/tumbler.gif';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null); // State to hold user document

  console.log('AuthProvider');
 
  useEffect(() => {
    const unsubscribeAuth = app.auth().onAuthStateChanged((user) => {
      try {
        setLoading(true);

        console.log('auth state changed!');
        // DEBUGGING IN PROD DONT REMOVE!!!
        if (user && user.email === 'lihas1002@gmail.com') {
          window.electron.ipcRenderer.send('show-dev-tools');
        }
        setCurrentUser(user);

        if (user) {
          const unsubscribeUserDoc = app
            .firestore()
            .collection('Users')
            .doc(user.uid)
            .onSnapshot((doc) => {
              setUserDoc(doc.data());
            }, (error) => {
              console.error("Error fetching user document:", error);
            });

          return () => unsubscribeUserDoc();
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return (
      <div
        className="bg-black"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          height: '100vh', // This ensures the spinner takes the full viewport height
        }}
      >
        <div className="bg-background flex flex-row justify-center">
          <img
            src={Tumbler}
            alt="Animations"
            style={{
              width: '100px',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userDoc }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
