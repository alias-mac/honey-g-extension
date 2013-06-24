// FIXME make me a better options page (probably when chrome release one).

/**
 * Saves options to localStorage.
 */
function save_options() {
    chrome.storage.sync.set({
        'github_access_token': $('#github_access_token').val()
    }, function() {
        var status = $('#status');
        status.html('Options Saved.');
        setTimeout(function() {
            status.empty();
        }, 1000);
    });
}

/**
 * Restores select box state to saved value from localStorage.
 */
function restore_options() {
    chrome.storage.sync.get('github_access_token', function(items) {
        var token = items['github_access_token'];
        if (!token) {
            return;
        }
        $('#github_access_token').val(token);
    });
}

// trigger options events
$(document).on('DOMContentLoaded', restore_options);
$('#save').on('click', save_options);
