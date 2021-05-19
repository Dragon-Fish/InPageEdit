const version = require('../module/version')

const { _msg } = require('../module/_msg')
// const api = require('../module/api');
const { versionInfo } = require('../module/versionInfo')
const { specialNotice } = require('../module/specialNotice')

function updateNotice() {
  if (localStorage.getItem('InPageEditVersion') !== version) {
    ssi_modal.notify('', {
      title: _msg('updatelog-update-success-title'),
      content: _msg('updatelog-update-success', version),
      className: 'in-page-edit',
      buttons: [
        {
          className: 'btn btn-primary',
          label: _msg('updatelog-button-versioninfo'),
          method(a, modal) {
            localStorage.setItem('InPageEditVersion', version)
            versionInfo()
            modal.close()
          },
        },
      ],
      closeAfter: {
        time: 10,
        resetOnHover: true,
      },
      onClose() {
        localStorage.setItem('InPageEditVersion', version)
        // ssi_modal.notify('', {
        //   className: 'in-page-edit',
        //   content: _msg('updatelog-after-close', `[${api.updatelogsUrl} ${api.updatelogsUrl}]`, `[${api.githubLink}/issues ${_msg('updatelog-file-issue')}]`),
        //   closeAfter: {
        //     time: 10
        //   },
        //   buttons: [{
        //     className: 'btn btn-primary',
        //     label: _msg('ok'),
        //     method(a, modal) {
        //       modal.close();
        //     }
        //   }]
        // });
      },
    })
  }
  if (localStorage.getItem('InPageEditNoticeId') !== _msg('noticeid')) {
    specialNotice()
  }
}

module.exports = {
  updateNotice,
}
