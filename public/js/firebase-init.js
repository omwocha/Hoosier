(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyAs0XLqA56q3RzcIHT6duDNFFdZLi1_50A",
    authDomain: "hoosier-camp.firebaseapp.com",
    databaseURL: "https://hoosier-camp-default-rtdb.firebaseio.com",
    projectId: "hoosier-camp",
    storageBucket: "hoosier-camp.firebasestorage.app",
    messagingSenderId: "863397091488",
    appId: "1:863397091488:web:457bd3cd8063574f1451c5",
    measurementId: "G-CKJDWTE28K"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
})();
