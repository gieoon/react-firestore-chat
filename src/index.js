import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import styles from './styles.module.css'
import './index.css';
import firebase from  'firebase';
import {
  DB_ROOT_USERS,
  DB_ROOT_CHAT,
  DB_MESSAGES
} from './config.js';

// React.forwardRef
const Chat = forwardRef((props, ref) => {
// const Chat = ({ 
  //   firebaseConfig,
  //   userId,
  //   textColor,
  //   backgroundColor,
  //   text,
  // }) => {
    // console.log("props: ", props);
    const msgRef = useRef();

    const [expand, setExpand] = useState(false);

    const [db, setDb] = useState({});

    // Dictionary of all chat messages
    const [allMessages, setAllMessages] = useState([]);

    // TODO set to the first
    const [selectedUserId, setSelectedUserId] = useState("");

    const [users, setUsers] = useState([]);

    useEffect(()=>{
      firebase.initializeApp(props.firebaseConfig);
      var tdb = firebase.firestore();
      setDb(tdb)
      getUserChatMessages(tdb);
    },[]);

    const getUserChatMessages = (db) => {
      return db.collection(DB_ROOT_USERS)
        .doc(props.userId)
        .onSnapshot(doc => {
              console.log('detected new doc: ', doc.id, doc.data());
              // console.log(doc.get('chatIds'))
              if(doc.get('chatIds')){
                for(var chatPath of doc.get('chatIds')){
                  listenToChatFromId(chatPath.path, db);
                }
              }
          // snapshot.docChanges().forEach(change => {
          //   if(change.type === "added"){
          //     console.log('detected new doc: ', change.doc.id, change.doc.get('chatIds'));
          //     for(var chatPath of []){
          //       getChatFromId(chatPath);
          //     }
          //   } else if(change.type === "modified"){
          //     console.log('detected modified doc: ', change.doc.id);
          //   }
          // })
          
          
        })
    }

    const listenToChatFromId = (chatPath, db) => {
      // console.log('chatPath: ', chatPath);
      db.doc(chatPath).onSnapshot(doc => {
        console.log(doc.id, doc.data());
        const otherParticipantId = getOtherParticipantValue(doc.data());
        // console.log("otherParticipantId: ", otherParticipantId)
        getUserDetailsFromId(otherParticipantId, db).then((userDetails)=>{
          const tusers = [...users]; // Need to copy object, = is the same reference
          // TODO organize user details by date of last message
          tusers.push(userDetails);
          
          //TODO remove this
          for(var i=0;i<100;i++){
            tusers.push(userDetails);
          }

          setUsers(tusers);
        })
      })

      // Listen for changes in Messages
      db.doc(chatPath)
        .collection(DB_MESSAGES)
        .orderBy('createdDate','asc')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach((change) => {
            if(change.type === "added"){
              console.log('detected new doc: ', change.doc.id, change.doc.get('chatIds'));
              const messages = {...allMessages};
            } else if(change.type === "modified"){
              console.log('detected modified doc: ', change.doc.id);
            }
          });
        })
    }

    const getUserDetailsFromId = async (id, db) => {
        return db.collection(DB_ROOT_USERS)
          .doc(id)
          .get()
          .then(doc => {
            // console.log(doc.data())
            return doc.data();
          })
          .catch(err => console.error("Error retrieving user details: ", err));
    }

    const getOtherParticipantValue = (obj) => {
      if(obj.participant1 === props.userId) return obj.participant2;
      else return obj.participant1;
    }

    // Functions available to outside methods via ref
    useImperativeHandle(ref, () => ({
      // createNewChatMessage();
      // console.log(ref);
      createNewChatMessage
      // return {};
    })
    );

    const createNewChatMessage = (participant1, participant2) => {
      console.log('creating new chat message');
      // if(!Object.keys(db).length) return;
      db.collection(DB_ROOT_CHAT)
        .add({
          participant1: participant1,
          participant2: participant2,
          participant1UnreadIndex: 1,
          participant2UnreadIndex: 1,
        })
        // Save to own id
        .then((id)=>{
          db.collection(DB_ROOT_USERS)
            .doc(participant1)
            .set({
              chatIds: firebase.firestore.FieldValue.arrayUnion(id)
            }, {merge: true})
          db.collection(DB_ROOT_USERS)
            .doc(participant2)
            .set({
              chatIds: firebase.firestore.FieldValue.arrayUnion(id)
            }, {merge: true})
          
        })
        .catch(err => console.error("Error creating new chat messsage: ", err))
    }

    const sendMessage = (txt, chatId, msgId) => {
      db.collection(DB_ROOT_CHAT)
        .doc(chatId)
        .collection(DB_MESSAGES)
        .doc(msgId)
        .set({
          text: txt,
          author: userId,
          createdDate: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(()=>console.log('Message sent successfully'))
        .catch(err => console.error("Error sending message"));
    }

    // Set unreadIndex to 0
    const readMessage = (chatId, msgId) => {
      db.collection(DB_ROOT_CHAT)
        .doc(chatId)
    }
    
    // console.log('users: ', users.length);
    return <div 
        style={{
          backgroundColor: props.backgroundColor,
          color: props.textColor,
        }}
        className={styles.chat_wrapper}
        onClick={()=>{}}
      >
        <div id={styles.chat_wrapper_inner}>
          <div id={styles.chat_wrapper_users}>
            { 
              users.map((user, index) => (
                <div key={"chat-user-" + index} className={styles.chat_user}>
                  <img src={user.photoUrl} alt="" />
                  <span className={styles.username}>{user.username}</span>
                </div>
              ))
            }
          </div>
          <div 
            id={styles.chat_wrapper_messages}
            ref={msgRef}>
              {allMessages[selectedUserId].map((message, index) => (
                <div key={"message-" + index}>
                  {
                    message.text
                  }
                </div>
              ))
              }
          </div>
        </div>
      </div> 
  // }
})

export default Chat;