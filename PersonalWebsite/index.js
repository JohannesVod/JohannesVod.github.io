import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const app = initializeApp({
    apiKey: "AIzaSyClVQdtoNgOYdyschXzGHf8GPJgstgj_XE",
    authDomain: "blogposts-3529f.firebaseapp.com",
    projectId: "blogposts-3529f",
    storageBucket: "blogposts-3529f.appspot.com",
    messagingSenderId: "734055283955",
    appId: "1:734055283955:web:cc15046810b339a90bcb86",
    measurementId: "G-8GTBSBPWYP"
});

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const database  = getFirestore();

fetch('https://api.ipify.org?format=json')
  .then(response => response.json())
  .then(data => {
    var profile = document.getElementById('profile-picture');
    profile.src = 'profile.jpg';
    profile.classList.remove("skeleton");
    addDoc(collection(database, 'catchSca'), {
        timestamp: Timestamp.now(),
        ip: data.ip,
        Usertimezone: timezone
    });
});