// I grab the spinner element globally to be used across the application.
const spinner = document.getElementById("spinner");

// I remove the hidden attribute to display the loading indicator.
function showSpinner() {
  spinner.removeAttribute('hidden');
}

// I hide the spinner after a short delay to ensure smoother UI transitions.
function hideSpinner() {
  setTimeout(() => {
    spinner.setAttribute('hidden', '');
  }, 2000);
}