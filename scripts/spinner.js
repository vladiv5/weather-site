const spinner = document.getElementById("spinner");

function showSpinner() {
  spinner.removeAttribute('hidden');
}

function hideSpinner() {
  setTimeout(() => {
    spinner.setAttribute('hidden', '');
  }, 2000);
}