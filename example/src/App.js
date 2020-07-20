import React, { useRef } from 'react'

import Chat from 'react-firestore-chat'
import 'react-firestore-chat/dist/index.css'

const firebaseConfig = {
  apiKey: "AIzaSyDZOnfAFgXvrABedijrzR42vjhA-Strl1A",
  authDomain: "speek-5d61f.firebaseapp.com",
  databaseURL: "https://speek-5d61f.firebaseio.com",
  projectId: "speek-5d61f",
  storageBucket: "speek-5d61f.appspot.com",
  messagingSenderId: "892105399363",
  appId: "1:892105399363:web:9cc25b318654e31c8a08f6",
  measurementId: "G-J9322EP1HD"
}
const App = () => {
  const chatRef = React.useRef(); //createRef(); //useRef();
  
  return <div>
    <div onClick={()=>{
      console.log(chatRef);
      chatRef.current.createNewChatMessage("BQPCTducNBepxzqkVLXICJfvtg12","participant2");
    }}>
      New Message
    </div>
    <Chat 
      firebaseConfig={firebaseConfig}
      userId="BQPCTducNBepxzqkVLXICJfvtg12"
      textColor="white"
      backgroundColor="#EB2764"
      ref={chatRef}
    />
  </div>
}

export default App
