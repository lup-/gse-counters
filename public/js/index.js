let config = {
  apiKey: "AIzaSyBk0vQyhDx_h3L8T3FN_Q0eJuWloEvsWG4",
  authDomain: "gse-counters.firebaseapp.com",
  databaseURL: "https://gse-counters.firebaseio.com",
  projectId: "gse-counters",
  storageBucket: "gse-counters.appspot.com",
  messagingSenderId: "294706674059"
};
firebase.initializeApp(config);
let db = firebase.firestore();

function saveCounter(counterData) {
  return db.collection("couters_data").add(counterData);
}
function saveCounters() {
  let data = getDataFromDOM();
  let preparedData = data.counters.map( (counter) => {
    return {
      date: data.date,
      street: data.street,
      home: data.home,
      flat: data.flat,
      index: counter.index,
      num: counter.num,
      type: counter.type,
      current: counter.current,
      prev: counter.prev
    }
  });
  return Promise.all(preparedData.map(saveCounter));
}
function getLastCountersDate(user) {
  return db.collection("couters_data")
    .where('street', '==', user.street)
    .where('home', '==', user.home)
    .where('flat', '==', user.flat)
    //.orderBy('date', 'desc')
    //.limit(1)
    .get()
    .then((querySnapshot) => {
      let maxDate = 0;
      querySnapshot.forEach((doc) => {
        if (doc.data().date > maxDate) {
          maxDate = doc.data().date;
        }
      });
    
      return maxDate;
    });
}
function querySnapshotToArray(querySnapshot) {
  let result = [];
  querySnapshot.forEach((doc) => {
    result.push(doc.data());
  });
  return result;
}
function readLastCounters(user) {
  return getLastCountersDate(user)
    .then((lastDate) => {
       return db.collection("couters_data")
          .where('date', '==', lastDate)
          .orderBy('index', 'asc')
          .get()
          .then(querySnapshotToArray)
    });
}
function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}
function setCookie(name, value, options) {
  options = options || {};

  var expires = options.expires;

  if (typeof expires == "number" && expires) {
    var d = new Date();
    d.setTime(d.getTime() + expires * 1000);
    expires = options.expires = d;
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }

  value = encodeURIComponent(value);

  var updatedCookie = name + "=" + value;

  for (var propName in options) {
    updatedCookie += "; " + propName;
    var propValue = options[propName];
    if (propValue !== true) {
      updatedCookie += "=" + propValue;
    }
  }

  document.cookie = updatedCookie;
}
function addCounter(num, type, current, prev) {
  num = num ? num : '';
  type = type ? type : false;
  current = current ? current : '';
  prev = prev ? prev : false;
  
  let counterHTML = `<tr>
    <td data-title="Номер">
      <div class="d-flex">  
        <input type="text" class="form-control flex-fill num mr-2" value="${num}">
        ${type
          ? '<input type="text" readonly class="form-control-plaintext type" value="' + type +'">'
          : '<select class="form-control type"><option value="гор">гор</option><option value="хол">хол</option></select>'
        }
      </div>
    </td>
    <td data-title="Текущие">
      <input type="text" class="form-control current" value="${current}">
    </td>
    <td data-title="Предыдущие">
      ${prev
          ? '<input type="text" readonly class="form-control-plaintext prev" value="' + prev +'">'
          : '<input type="text" class="form-control prev" value="">'
        }
    </td>
  </tr>`;
  
  $('tbody').append(counterHTML);
}
function getUserDataFromDOM() {
    return {
      street: $('#street').val(),
      home: $('#home').val(),
      flat: $('#flat').val(),
      fio: $('#fio').val(),
      ls: $('#ls').val()
    }
}
function getUserDataFromCookies() {
  let savedData = getCookie('gse_user');
  if (savedData) {
    return JSON.parse(savedData);
  }
  
  return false;
}
function getDataFromDOM() {
  let userData = getUserDataFromDOM();
  let counters = $('tbody tr').map((index, row) => {
    let $row = $(row);
    return {
      index: index,
      num: $row.find('.num').val(),
      type: $row.find('.type').val(),
      current: $row.find('.current').val(),
      prev: $row.find('.prev').val()
    }
  }).toArray();
  
  let allData = userData;
  allData['date'] = Date.now();
  allData['counters'] = counters;
  
  return allData;
}
function saveUserData() {
  let data = JSON.stringify(getUserDataFromDOM());
  setCookie('gse_user', data);
}
function loadAndShowCountersData(userData) {
  return readLastCounters(userData)
      .then((counters) => {
        $('tbody').html('');
        counters.forEach((counter) => addCounter(counter.num, counter.type, '', counter.current));
      });
}
function loadAndShowUserData() {
  let userData = getUserDataFromCookies();
  if (userData) {
    Object.keys(userData).forEach((field) => $('#'+field).val(userData[field]));
    loadAndShowCountersData(userData);
  }
  else {
    addCounter();
  }
}
function saveUserAndLoadCounters() {
  saveUserData();
  let data = getUserDataFromDOM();
  loadAndShowCountersData(data);
}
function sendCountersEmail() {
  let countersData = getDataFromDOM();
  let alsoSendEmail = $('#also').val();
  countersData['to'] = ['counters@glavstroy-group.ru'];
  if (alsoSendEmail) {
    countersData['to'].push(alsoSendEmail);
  }
  
  return $.ajax({
    method: "POST",
    dataType: 'json',
    processData: false,
    url: "https://untitled-lw2qs8t4nh33.runkit.sh/",
    data: JSON.stringify(countersData)
  })
  .then((response) => {
    if (!response.success) {
      let messageText = 'Непонятная ошибка';
      if (typeof(resonse.info) !== 'undefined') {
        messageText = response.info.message;        
      }
      throw new Error(messageText);
    }
    return response;
  });
}

loadAndShowUserData();

$(document).on('click', '#addCounter', (event) => {
  event.preventDefault();
  addCounter();
});
$(document).on('click', '#send', (event) => {
  event.preventDefault();
  $('#send')
    .removeClass('btn-danger')
    .removeClass('btn-success')
    .addClass('btn-primary')
    .text('Идет отправка...')
    .attr('disabled', true);
  
  saveCounters()
    .then(sendCountersEmail)
    .then(() => {
      $('#send')
        .removeClass('btn-primary')
        .addClass('btn-success')
        .text('Успешно отправлено');
    })
    .catch((error) => {
      $('#send')
        .removeClass('btn-primary')
        .addClass('btn-danger')
        .text('Ошибка! Отправить повторно')
        .attr('disabled', true);;
    });
});
$(document).on('change', 'input:not(table input, #also)', saveUserAndLoadCounters);