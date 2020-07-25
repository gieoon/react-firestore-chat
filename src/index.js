import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import './index.scss';
import styles from './styles.module.css'
import firebase from  'firebase';
import get from './language.js';
import {convertTimestampToTime, convertTimestampToDate} from './helpers.js';
// import {Router, Link} from 'react-router-dom';
import {
  DB_ROOT_USERS,
  DB_ROOT_CHAT,
  DB_MESSAGES,
  DB_CHATS,
} from './config.js';

var db = {};

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

    // const [db, setDb] = useState({});

    // Dictionary of all chat messages
    const [allMessages, setAllMessages] = useState({});

    // TODO set to the first
    const [selectedUserId, setSelectedUserId] = useState("");

    const [selectedUser, setSelectedUser] = useState({});

    const [currentChatId, setCurrentChatId] = useState("");

    const [users, setUsers] = useState({});

    const chatFormRef = useRef(null);

    useEffect(()=>{
      firebase.initializeApp(props.firebaseConfig);
      db = firebase.firestore();
      // setDb(tdb)
      getUserChatMessages(db);
    },[]);

    useEffect(()=>{
      scrollToBottom();
    }, [allMessages])

    const getUserChatMessages = (db) => {
      return db.collection(DB_ROOT_USERS)
        .doc(props.userId)
        .collection(DB_CHATS)
        .onSnapshot(docs => {
          docs.docChanges().forEach((change)=>{
            if(change.type === "added"){
              console.log("detected user's chat: ", change.doc.id);
              listenToChatFromId(change.doc.get('chatPath'), db)
            } else if(change.type === "modified"){
              console.log('detected modified chat: ', change.doc.id);
              // listenToChatFromId(doc.get('chatPath'))
            }
          })
        })
    }

    const listenToChatFromId = (chatPath, db) => {
      // console.log('chatPath: ', chatPath);
      const chatId = chatPath.id;
      db.doc(chatPath.path).onSnapshot(doc => {
        // console.log("chat details: ", doc.id, doc.data());
        const otherParticipantId = getOtherParticipantValue(doc.data());
        // console.log("otherParticipantId: ", otherParticipantId)
        getUserDetailsFromId(otherParticipantId, db).then((userDetails)=>{
          // const tusers = [...users]; // Need to copy object, = is the same reference
          const tusers = {...users}; // Need to copy object, = is the same reference
          // TODO organize user details by date of last message
          // console.log('tusers: ', tusers);
          // console.log('userDetails: ', userDetails);
          // tusers.push(userDetails);
          tusers[otherParticipantId] = {...userDetails, chatId: doc.id };

          setUsers(tusers);
          //TODO set this to latest message date user
          if(!Object.keys(selectedUser).length)
            setSelectedUser({...userDetails, chatId: doc.id});
            // console.log(doc.id);
            setCurrentChatId(doc.id);
        })
      })

      // Listen for changes in Messages
      db.doc(chatPath.path)
        .collection(DB_MESSAGES)
        .orderBy('createdDate','asc')
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach((change) => {
            if(change.type === "added" || change.type === "modified"){ // || change.type === "modified"  
              if(!change.doc.get('createdDate'))
                return;
              console.log('detected message: ', change.type, change.doc.id, change.doc.data());
              const messages = allMessages;

            // } else if(change.type === "modified"){
              // console.log('detected modified doc: ', change.doc.id);
              // const messages = {...allMessages}; // This doesn't work, is not triggered as new object
              // console.log("allMessages, messages: ", allMessages, messages);
              if(!messages[chatId]){
                messages[chatId] = [];
              }
              messages[chatId].push(change.doc.data());
              setAllMessages({...messages}); // Force as new object
              // console.log('messages: ', messages, allMessages);
              // scrollToBottom();
            }
          });
        })
    }

    const scrollToBottom = () => {
      // console.log('scrolling');
      
      window.requestAnimationFrame(function() {
        const chatArea = document.getElementById(styles.ma_message_area);
        // console.log('chatArea: ', chatArea)
        window.setTimeout(()=>{
          // if(!chatArea) return;
          chatArea.scrollTop = chatArea.scrollHeight;
          // console.log('scrolled: ', chatArea.scrollTop, chatArea.scrollHeight)
        }, 500);
      });
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
            .collection(DB_CHATS)
            .add({
              chatPath: id,
              // chatPath: firebase.firestore.FieldValue.arrayUnion(id)
            })

          db.collection(DB_ROOT_USERS)
            .doc(participant2)
            .collection(DB_CHATS)
            .add({
              chatPath: id,
              // chatPath: firebase.firestore.FieldValue.arrayUnion(id)
            })
          
        })
        .catch(err => console.error("Error creating new chat messsage: ", err))
    }

    // Set unreadIndex to 0
    // 1. Identify which participant type this is
    const readMessage = (chatId, msgId) => {
      db.collection(DB_ROOT_CHAT)
        .doc(chatId)
    }

    const userSelected = (e, component, user) => {
      console.log("user selected: ", e, component, user);
      setSelectedUser(user);
      setCurrentChatId(user.chatId);
    }
    
    // console.log('users: ', users);
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
              Object.values(users).map((user, index) => (
                <div key={"chat-user-" + index} className={styles.chat_user} onClick={(e)=>{userSelected(e, this, user)}}>
                  <img src={user.photoUrl} alt="" />
                  <span className={styles.username}>{user.username}</span>
                </div>
              ))
            }
          </div>
          <MessageArea 
            userId={props.userId} 
            selectedUser={selectedUser} 
            allMessages={allMessages} 
            msgRef={msgRef} 
            styles={styles} 
            selectedUserId={selectedUserId} 
            chatFormRef={chatFormRef} 
            chatId={currentChatId} />
        </div>
      </div> 
  // }
})

function MessageArea({
  userId,
  selectedUser,
  allMessages,
  styles,
  chatFormRef,
  chatId
}){

  const f_sendMsg = () => {
    console.log("chatid: ", chatId);
    // return;
    var txt = chatFormRef.current.firstChild.value;
    // console.log('sending message: ', chatFormRef.current.firstChild.value);
    db.collection(DB_ROOT_CHAT)
      .doc(chatId)
      .collection(DB_MESSAGES)
      // .doc(msgId)
      .add({
        text: txt,
        author: userId,
        createdDate: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(()=>{
        console.log('Message sent successfully')
        chatFormRef.current.firstChild.value = "";
      })
      .catch(err => console.error("Error sending message"));
    
  }
  // console.log(allMessages);
  return(
    <div id={styles.ma_message_wrapper}>
      <ChatHeader selectedUser={selectedUser} />
      <ChatArea messages={allMessages[selectedUser.chatId] || []} selectedUser={selectedUser} userId={userId} />
      
      <div id={styles.ma_input_area}>
        <ChatForm chatFormRef={chatFormRef} />
        <ChatBottom userId={userId} selectedUser={selectedUser} f_sendMsg={f_sendMsg} chatFormRef={chatFormRef} />
      </div>
    </div>
  )
}

function ChatHeader({
  selectedUser,
}){
  return <a href={'../user/' + selectedUser.nickname} id={styles.ma_header_link}>          
    <div id={styles.ma_header_area}>
      <span id={styles.ma_header_username}>{selectedUser.username}</span>
      <span id={styles.ma_header_nickname}>{selectedUser.nickname}</span>
      <br/>
      <span id={styles.ma_header_location}>{selectedUser.location}</span>
    </div>
  </a>
}

function ChatArea({
  messages,
  selectedUser,
  userId,
}){
  // console.log(Array.isArray(messages))
  // console.log(messages.length)
  var lastDay = "";

  return <div 
        // className="chatContainer"
        id={styles.ma_message_area}
      >
      {!messages.length || 1
        ? <div className={styles.chatHeader} >
          {/* <hr style={{borderTopWidth:"2px",borderColor:"#EB2764",backgroundColor:"#EB2764",color:"#EB2764"}}/> */}
          <span className={styles.chatHeader_startOfChat}>{get('START_OF_CHAT')} {selectedUser.username}</span>
        </div>
        : ""
      }  
      <div className={"chatArea"}>
          {
              messages.map((message, index1) => (
                  <div key={index1}>
                      {/* {   messages.length ?
                          <span className="chatBoxTimeSeparator">
                              {
                                  // The first timestamp is indicative of the first chat time, so we set a date from the first
                                  convertTimestampToDate(messages[0].timestamp) 
                              }
                          </span>
                          : ""
                      } */}
                      { lastDay !== convertTimestampToDate(message.createdDate?.seconds)
                        ? <span className={styles.chatBoxTimeSeparator}>
                          {/* {lastDay = convertTimestampToDate(message.createdDate?.seconds) } */}
                          {
                              // If the day is different, this is indicative of a new day and print it and assign to a variable. 
                              // React interprets this as saving a variable but also printing it
                              lastDay = convertTimestampToDate(message.createdDate?.seconds) 
                          }
                        </span>
                        : ""
                      }
                        <ChatMessage 
                            // unreadIndex={index1 === this.state.unreadMsgDayIndex && index2 === this.state.unreadMsgIndex}
                            userId={userId}
                            m={message} 
                            selectedUser={selectedUser} 
                            index={index1} 
                            key={"chat-message-" + index1} />
                    ))
                  </div>
              ))
          }
      </div>
  </div>
}


class ChatMessage extends React.Component {
  constructor(props){
      super(props);
      this.state = {
          userId: props.userId,
          m:  props.m,
          selectedUser: props.selectedUser,
          index: props.index,
          unreadIndex: 0,//props.unreadIndex,
          loading: false // TODO dynamically set this, display text from the start and update its loading state based on dynamically assigned refs, or targeting DOM ID
      }
  }

  render(){
      // console.log('printing message: ', this.props.m, this.props.userId);
      return(
          <div>
              <div key={this.state.index} className={`${styles.chatBox} ${(this.props.m.author === this.props.userId ? styles.self_send : "")}`}>
                  <span className={this.state.loading ? styles.soft : ""}>{this.props.m.text} </span>
                  {
                      this.state.loading 
                      ? ""
                      : <span className={styles.chatBox_msg_time}>
                          {" " + String.fromCharCode("0x2022") + " "}
                          {convertTimestampToTime(this.props.m.createdDate?.seconds)}
                      </span>
                  }
                  <span className={"chat-unread " + (this.props.unreadIndex ? " chat-unreadTag " : "")}></span>
              </div>
          </div>
      );
  }
}


class ChatForm extends React.Component {
  constructor(props){
      super(props);
      this.state = {
          chatFormRef: props.chatFormRef
      }
  }
  
  chatFormClicked = (b) => {
      // const el = document.getElementsByClassName("chatForm")[0];
      const el = this.props.chatFormRef.current;
      //if(el.classList.contains("active")){
      if(!b){
          el.classList.remove(styles.active);
      } else {
          el.classList.add(styles.active);
      }
  }

  render(){
      return <div className={`${styles.chatForm}`}
          ref={this.props.chatFormRef}

          onFocus={()=>{this.chatFormClicked(true)}}
          onBlur={()=>{this.chatFormClicked(false)}}>
          {/* <textarea ref={this.props.chatFormRef} className="chatForm-inner"  */}
          <textarea className={`${styles.chatForm_inner}`}
              //defaultValue="Write your message here..." 
              placeholder="Write your message here...">
          </textarea>
      </div>
  }   
}

function ChatBottom(props){
  return <div className={styles.chatBottom}>
      <div style={{color:"black"}}>feature1, feature2, feature3, Paid feature1, Paid feature2</div>
      <div className={styles.msgArea_contents_inner_button_container}>
          <div
              id={styles.ANALYTICS_sendChatMessage} 
              className={styles.msgArea_contents_inner_button}
              onClick={()=>{
                  props.f_sendMsg()}}
          >{get('C_SEND')}</div>
      </div>
  </div>
}

export default Chat;