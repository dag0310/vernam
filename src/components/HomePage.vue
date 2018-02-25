<template>
  <v-ons-page id="home">
    <v-ons-toolbar>
      <div class="left">
        <v-ons-toolbar-button @click="showSettingsPage">
          <v-ons-icon icon="ion-ios-gear, material:md-settings"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
      <div class="center">Conversations</div>
      <div class="right">
        <v-ons-toolbar-button @click="">
          <v-ons-icon icon="ion-ios-compose-outline" @click="showContactPicker"></v-ons-icon>
        </v-ons-toolbar-button>
      </div>
    </v-ons-toolbar>
    <div class="content">
      <p class="searchContainer marginalizedContent">
        <v-ons-search-input placeholder="Search" v-model="searchText"></v-ons-search-input>
        <span class="clearSearch" @click="searchText = ''" v-show="searchText.length > 0">×</span>
      </p>
      <v-ons-list v-show="filteredConversations.length > 0">
        <v-ons-list-item v-for="conversation in filteredConversations" :key="conversation.id" tappable @click="showConversationPage(conversation)">
          <div class="center">
            <span class="list-item__title ellipsis" :class="{bold: conversation.newMessages}">{{ conversation.name }}</span>
            <span class="list-item__subtitle ellipsis" :class="{bold: conversation.newMessages}">
              {{ lastMessageText(conversation) }}
            </span>
          </div>
          <div class="right">
            <span class="list-item__label">{{ lastMessageDateText(conversation) }}</span>
            <ons-icon icon="ion-ios-trash-outline" class="list-item__icon" @click.stop="deleteConversation(conversation)"></ons-icon>
            <ons-icon icon="ion-ios-arrow-forward" class="list-item__icon"></ons-icon>
          </div>
        </v-ons-list-item>
      </v-ons-list>
      <div class="marginalizedContent infoText" v-show="filteredConversations.length <= 0">
        No conversations found
      </div>
    </div>
    <v-ons-alert-dialog modifier="rowfooter" :visible.sync="identitySet">
      <span slot="title">🔑 Welcome to Vernam! 🔑</span>
      Please enter your country and phone number to start texting.
      <br><br>
      <v-ons-select v-model="selectedCountryCode">
        <option disabled value="">Select your country</option>
        <option v-for="country in countries" :value="country.countryCode">
          {{ country.name }} (+{{ country.callingCode }})
        </option>
      </v-ons-select>
      <br><br>
      <label v-show="selectedCountryCode" class="countryCodeLabel">+{{ getCallingCode(selectedCountryCode) }}</label>
      <v-ons-input placeholder="Phone number" float v-model="phoneNumber"></v-ons-input>
      <template slot="footer">
        <div class="alert-dialog-button" @click="setIdentity()">Finished</div>
      </template>
    </v-ons-alert-dialog>
  </v-ons-page>
</template>

<script>
import Settings from './Settings'
import Conversation from './Conversation'
import { parse, format } from 'libphonenumber-js'

const countryNames = {'BD': 'Bangladesh', 'BE': 'Belgium', 'BF': 'Burkina Faso', 'BG': 'Bulgaria', 'BA': 'Bosnia and Herzegovina', 'BB': 'Barbados', 'WF': 'Wallis and Futuna', 'BL': 'Saint Barthelemy', 'BM': 'Bermuda', 'BN': 'Brunei', 'BO': 'Bolivia', 'BH': 'Bahrain', 'BI': 'Burundi', 'BJ': 'Benin', 'BT': 'Bhutan', 'JM': 'Jamaica', 'BV': 'Bouvet Island', 'BW': 'Botswana', 'WS': 'Samoa', 'BQ': 'Bonaire, Saint Eustatius and Saba ', 'BR': 'Brazil', 'BS': 'Bahamas', 'JE': 'Jersey', 'BY': 'Belarus', 'BZ': 'Belize', 'RU': 'Russia', 'RW': 'Rwanda', 'RS': 'Serbia', 'TL': 'East Timor', 'RE': 'Reunion', 'TM': 'Turkmenistan', 'TJ': 'Tajikistan', 'RO': 'Romania', 'TK': 'Tokelau', 'GW': 'Guinea-Bissau', 'GU': 'Guam', 'GT': 'Guatemala', 'GS': 'South Georgia and the South Sandwich Islands', 'GR': 'Greece', 'GQ': 'Equatorial Guinea', 'GP': 'Guadeloupe', 'JP': 'Japan', 'GY': 'Guyana', 'GG': 'Guernsey', 'GF': 'French Guiana', 'GE': 'Georgia', 'GD': 'Grenada', 'GB': 'United Kingdom', 'GA': 'Gabon', 'SV': 'El Salvador', 'GN': 'Guinea', 'GM': 'Gambia', 'GL': 'Greenland', 'GI': 'Gibraltar', 'GH': 'Ghana', 'OM': 'Oman', 'TN': 'Tunisia', 'JO': 'Jordan', 'HR': 'Croatia', 'HT': 'Haiti', 'HU': 'Hungary', 'HK': 'Hong Kong', 'HN': 'Honduras', 'HM': 'Heard Island and McDonald Islands', 'VE': 'Venezuela', 'PR': 'Puerto Rico', 'PS': 'Palestinian Territory', 'PW': 'Palau', 'PT': 'Portugal', 'SJ': 'Svalbard and Jan Mayen', 'PY': 'Paraguay', 'IQ': 'Iraq', 'PA': 'Panama', 'PF': 'French Polynesia', 'PG': 'Papua New Guinea', 'PE': 'Peru', 'PK': 'Pakistan', 'PH': 'Philippines', 'PN': 'Pitcairn', 'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon', 'ZM': 'Zambia', 'EH': 'Western Sahara', 'EE': 'Estonia', 'EG': 'Egypt', 'ZA': 'South Africa', 'EC': 'Ecuador', 'IT': 'Italy', 'VN': 'Vietnam', 'SB': 'Solomon Islands', 'ET': 'Ethiopia', 'SO': 'Somalia', 'ZW': 'Zimbabwe', 'SA': 'Saudi Arabia', 'ES': 'Spain', 'ER': 'Eritrea', 'ME': 'Montenegro', 'MD': 'Moldova', 'MG': 'Madagascar', 'MF': 'Saint Martin', 'MA': 'Morocco', 'MC': 'Monaco', 'UZ': 'Uzbekistan', 'MM': 'Myanmar', 'ML': 'Mali', 'MO': 'Macao', 'MN': 'Mongolia', 'MH': 'Marshall Islands', 'MK': 'Macedonia', 'MU': 'Mauritius', 'MT': 'Malta', 'MW': 'Malawi', 'MV': 'Maldives', 'MQ': 'Martinique', 'MP': 'Northern Mariana Islands', 'MS': 'Montserrat', 'MR': 'Mauritania', 'IM': 'Isle of Man', 'UG': 'Uganda', 'TZ': 'Tanzania', 'MY': 'Malaysia', 'MX': 'Mexico', 'IL': 'Israel', 'FR': 'France', 'IO': 'British Indian Ocean Territory', 'SH': 'Saint Helena', 'FI': 'Finland', 'FJ': 'Fiji', 'FK': 'Falkland Islands', 'FM': 'Micronesia', 'FO': 'Faroe Islands', 'NI': 'Nicaragua', 'NL': 'Netherlands', 'NO': 'Norway', 'NA': 'Namibia', 'VU': 'Vanuatu', 'NC': 'New Caledonia', 'NE': 'Niger', 'NF': 'Norfolk Island', 'NG': 'Nigeria', 'NZ': 'New Zealand', 'NP': 'Nepal', 'NR': 'Nauru', 'NU': 'Niue', 'CK': 'Cook Islands', 'XK': 'Kosovo', 'CI': 'Ivory Coast', 'CH': 'Switzerland', 'CO': 'Colombia', 'CN': 'China', 'CM': 'Cameroon', 'CL': 'Chile', 'CC': 'Cocos Islands', 'CA': 'Canada', 'CG': 'Republic of the Congo', 'CF': 'Central African Republic', 'CD': 'Democratic Republic of the Congo', 'CZ': 'Czech Republic', 'CY': 'Cyprus', 'CX': 'Christmas Island', 'CR': 'Costa Rica', 'CW': 'Curacao', 'CV': 'Cape Verde', 'CU': 'Cuba', 'SZ': 'Swaziland', 'SY': 'Syria', 'SX': 'Sint Maarten', 'KG': 'Kyrgyzstan', 'KE': 'Kenya', 'SS': 'South Sudan', 'SR': 'Suriname', 'KI': 'Kiribati', 'KH': 'Cambodia', 'KN': 'Saint Kitts and Nevis', 'KM': 'Comoros', 'ST': 'Sao Tome and Principe', 'SK': 'Slovakia', 'KR': 'South Korea', 'SI': 'Slovenia', 'KP': 'North Korea', 'KW': 'Kuwait', 'SN': 'Senegal', 'SM': 'San Marino', 'SL': 'Sierra Leone', 'SC': 'Seychelles', 'KZ': 'Kazakhstan', 'KY': 'Cayman Islands', 'SG': 'Singapore', 'SE': 'Sweden', 'SD': 'Sudan', 'DO': 'Dominican Republic', 'DM': 'Dominica', 'DJ': 'Djibouti', 'DK': 'Denmark', 'VG': 'British Virgin Islands', 'DE': 'Germany', 'YE': 'Yemen', 'DZ': 'Algeria', 'US': 'United States', 'UY': 'Uruguay', 'YT': 'Mayotte', 'UM': 'United States Minor Outlying Islands', 'LB': 'Lebanon', 'LC': 'Saint Lucia', 'LA': 'Laos', 'TV': 'Tuvalu', 'TW': 'Taiwan', 'TT': 'Trinidad and Tobago', 'TR': 'Turkey', 'LK': 'Sri Lanka', 'LI': 'Liechtenstein', 'LV': 'Latvia', 'TO': 'Tonga', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'LR': 'Liberia', 'LS': 'Lesotho', 'TH': 'Thailand', 'TF': 'French Southern Territories', 'TG': 'Togo', 'TD': 'Chad', 'TC': 'Turks and Caicos Islands', 'LY': 'Libya', 'VA': 'Vatican', 'VC': 'Saint Vincent and the Grenadines', 'AE': 'United Arab Emirates', 'AD': 'Andorra', 'AG': 'Antigua and Barbuda', 'AF': 'Afghanistan', 'AI': 'Anguilla', 'VI': 'U.S. Virgin Islands', 'IS': 'Iceland', 'IR': 'Iran', 'AM': 'Armenia', 'AL': 'Albania', 'AO': 'Angola', 'AQ': 'Antarctica', 'AS': 'American Samoa', 'AR': 'Argentina', 'AU': 'Australia', 'AT': 'Austria', 'AW': 'Aruba', 'IN': 'India', 'AX': 'Aland Islands', 'AZ': 'Azerbaijan', 'IE': 'Ireland', 'ID': 'Indonesia', 'UA': 'Ukraine', 'QA': 'Qatar', 'MZ': 'Mozambique'}
const countryPhones = {'BD': '880', 'BE': '32', 'BF': '226', 'BG': '359', 'BA': '387', 'BB': '+1-246', 'WF': '681', 'BL': '590', 'BM': '+1-441', 'BN': '673', 'BO': '591', 'BH': '973', 'BI': '257', 'BJ': '229', 'BT': '975', 'JM': '+1-876', 'BV': '', 'BW': '267', 'WS': '685', 'BQ': '599', 'BR': '55', 'BS': '+1-242', 'JE': '+44-1534', 'BY': '375', 'BZ': '501', 'RU': '7', 'RW': '250', 'RS': '381', 'TL': '670', 'RE': '262', 'TM': '993', 'TJ': '992', 'RO': '40', 'TK': '690', 'GW': '245', 'GU': '+1-671', 'GT': '502', 'GS': '', 'GR': '30', 'GQ': '240', 'GP': '590', 'JP': '81', 'GY': '592', 'GG': '+44-1481', 'GF': '594', 'GE': '995', 'GD': '+1-473', 'GB': '44', 'GA': '241', 'SV': '503', 'GN': '224', 'GM': '220', 'GL': '299', 'GI': '350', 'GH': '233', 'OM': '968', 'TN': '216', 'JO': '962', 'HR': '385', 'HT': '509', 'HU': '36', 'HK': '852', 'HN': '504', 'HM': ' ', 'VE': '58', 'PR': '+1-787 and 1-939', 'PS': '970', 'PW': '680', 'PT': '351', 'SJ': '47', 'PY': '595', 'IQ': '964', 'PA': '507', 'PF': '689', 'PG': '675', 'PE': '51', 'PK': '92', 'PH': '63', 'PN': '870', 'PL': '48', 'PM': '508', 'ZM': '260', 'EH': '212', 'EE': '372', 'EG': '20', 'ZA': '27', 'EC': '593', 'IT': '39', 'VN': '84', 'SB': '677', 'ET': '251', 'SO': '252', 'ZW': '263', 'SA': '966', 'ES': '34', 'ER': '291', 'ME': '382', 'MD': '373', 'MG': '261', 'MF': '590', 'MA': '212', 'MC': '377', 'UZ': '998', 'MM': '95', 'ML': '223', 'MO': '853', 'MN': '976', 'MH': '692', 'MK': '389', 'MU': '230', 'MT': '356', 'MW': '265', 'MV': '960', 'MQ': '596', 'MP': '+1-670', 'MS': '+1-664', 'MR': '222', 'IM': '+44-1624', 'UG': '256', 'TZ': '255', 'MY': '60', 'MX': '52', 'IL': '972', 'FR': '33', 'IO': '246', 'SH': '290', 'FI': '358', 'FJ': '679', 'FK': '500', 'FM': '691', 'FO': '298', 'NI': '505', 'NL': '31', 'NO': '47', 'NA': '264', 'VU': '678', 'NC': '687', 'NE': '227', 'NF': '672', 'NG': '234', 'NZ': '64', 'NP': '977', 'NR': '674', 'NU': '683', 'CK': '682', 'XK': '', 'CI': '225', 'CH': '41', 'CO': '57', 'CN': '86', 'CM': '237', 'CL': '56', 'CC': '61', 'CA': '1', 'CG': '242', 'CF': '236', 'CD': '243', 'CZ': '420', 'CY': '357', 'CX': '61', 'CR': '506', 'CW': '599', 'CV': '238', 'CU': '53', 'SZ': '268', 'SY': '963', 'SX': '599', 'KG': '996', 'KE': '254', 'SS': '211', 'SR': '597', 'KI': '686', 'KH': '855', 'KN': '+1-869', 'KM': '269', 'ST': '239', 'SK': '421', 'KR': '82', 'SI': '386', 'KP': '850', 'KW': '965', 'SN': '221', 'SM': '378', 'SL': '232', 'SC': '248', 'KZ': '7', 'KY': '+1-345', 'SG': '65', 'SE': '46', 'SD': '249', 'DO': '+1-809 and 1-829', 'DM': '+1-767', 'DJ': '253', 'DK': '45', 'VG': '+1-284', 'DE': '49', 'YE': '967', 'DZ': '213', 'US': '1', 'UY': '598', 'YT': '262', 'UM': '1', 'LB': '961', 'LC': '+1-758', 'LA': '856', 'TV': '688', 'TW': '886', 'TT': '+1-868', 'TR': '90', 'LK': '94', 'LI': '423', 'LV': '371', 'TO': '676', 'LT': '370', 'LU': '352', 'LR': '231', 'LS': '266', 'TH': '66', 'TF': '', 'TG': '228', 'TD': '235', 'TC': '+1-649', 'LY': '218', 'VA': '379', 'VC': '+1-784', 'AE': '971', 'AD': '376', 'AG': '+1-268', 'AF': '93', 'AI': '+1-264', 'VI': '+1-340', 'IS': '354', 'IR': '98', 'AM': '374', 'AL': '355', 'AO': '244', 'AQ': '', 'AS': '+1-684', 'AR': '54', 'AU': '61', 'AT': '43', 'AW': '297', 'IN': '91', 'AX': '+358-18', 'AZ': '994', 'IE': '353', 'ID': '62', 'UA': '380', 'QA': '974', 'MZ': '258'}
const countries = []
for (const countryCode in countryNames) {
  countries.push({
    countryCode,
    name: countryNames[countryCode],
    callingCode: countryPhones[countryCode]
  })
}
countries.sort((a, b) => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
})

export default {
  name: 'home',
  data () {
    return {
      searchText: '',
      selectedCountryCode: '',
      phoneNumber: null,
      countries
    }
  },
  created () {
    const self = this
    document.addEventListener('show', function (event) {
      if (event.target.matches('#home')) {
        self.$store.commit('setCurrentConversationId', null)
      }
    }, false)

    this.$http.get('http://ipinfo.io').then(response => {
      this.selectedCountryCode = response.body.country
    })
  },
  computed: {
    identitySet () {
      return this.$store.state.id === null
    },
    conversations () {
      return this.$store.state.conversations
    },
    filteredConversations () {
      return this.conversations
        .filter(conversation => conversation.name.toUpperCase().includes(this.searchText.toUpperCase()))
        .sort((a, b) => {
          const lastMessageA = this.lastMessage(a)
          const lastMessageB = this.lastMessage(b)

          if (!lastMessageA && !lastMessageB) {
            return 0
          }
          if (!lastMessageA) {
            return 1
          }
          if (!lastMessageB) {
            return -1
          }

          return lastMessageB.timestamp - lastMessageA.timestamp
        })
    }
  },
  methods: {
    getCallingCode (countryCode) {
      const country = this.countries.find(country => country.countryCode === countryCode)
      return country ? country.callingCode : ''
    },
    setIdentity () {
      if (!this.selectedCountryCode) {
        this.$ons.notification.toast('Please select a country.', {timeout: 1000})
        return
      }
      if (!this.phoneNumber) {
        this.$ons.notification.toast('Please enter a phone number.', {timeout: 1000})
        return
      }
      const parsedNumber = parse(this.phoneNumber, this.selectedCountryCode)
      if (Object.keys(parsedNumber).length === 0 && parsedNumber.constructor === Object) {
        this.$ons.notification.toast('Please enter a valid phone number.', {timeout: 1000})
        return
      }
      const normalizedNumber = format(parsedNumber.phone, parsedNumber.country, 'E.164')

      this.$store.commit('setId', normalizedNumber)
      this.$store.commit('setCountryCode', this.selectedCountryCode)
    },
    lastMessage (conversation) {
      const messages = JSON.parse(JSON.stringify(conversation.messages)) // Avoids infinite loop in render function
      return (messages.length > 0) ? messages.sort((a, b) => b.timestamp - a.timestamp)[0] : null
    },
    lastMessageText (conversation) {
      const lastMessage = this.lastMessage(conversation)
      return lastMessage ? lastMessage.text : ''
    },
    lastMessageDateText (conversation) {
      const lastMessage = this.lastMessage(conversation)
      if (lastMessage !== null) {
        const humanDate = this.humanDate(lastMessage.timestamp)
        return humanDate.isToday ? humanDate.timeText : humanDate.dateText
      }
      return ''
    },
    showSettingsPage () {
      this.$emit('push-page', Settings)
    },
    showConversationPage (conversation) {
      this.$store.commit('setNewMessagesFalse', conversation.id)
      this.$store.commit('setCurrentConversationId', conversation.id)
      this.$emit('push-page', Conversation)
    },
    deleteConversation (conversation) {
      this.$ons.openActionSheet({ buttons: ['Delete conversation', 'Cancel'], title: conversation.name, cancelable: true, destructive: 0 }).then(response => {
        if (response === 0) {
          this.$store.commit('deleteConversation', conversation.id)
        }
      })
    },
    showContactPicker () {
      if (!navigator.contacts) {
        this.$ons.notification.toast('No contacts can be queried.', { timeout: 1000 })
        return
      }
      navigator.contacts.pickContact(contact => {
        if (contact.phoneNumbers.length <= 0) {
          this.showContactPicker()
          return
        }
        if (contact.phoneNumbers.length === 1) {
          this.createConversation(contact.displayName, contact.phoneNumbers[0].value)
          return
        }
        const buttons = contact.phoneNumbers.map(phoneNumber => phoneNumber.type.replace(/(^|\s)\S/g, l => l.toUpperCase()) + ' (' + this.normalizeNumber(phoneNumber.value) + ')')
        buttons.push('Cancel')
        this.$ons.openActionSheet({ buttons, title: 'Choose a number', cancelable: true }).then(numberIdx => {
          if (numberIdx === buttons.length) {
            return
          }
          this.createConversation(contact.displayName, contact.phoneNumbers[numberIdx].value)
        })
      }, err => {
        console.error('ERROR: ' + err)
      })
    },
    createConversation (name, rawNumber) {
      const normalizedNumber = this.normalizeNumber(rawNumber)
      if (this.$store.state.conversations.every(conversation => conversation.id !== normalizedNumber)) {
        this.$store.commit('createConversation', {
          id: normalizedNumber,
          name: name,
          messages: [],
          message: '',
          newMessages: false,
          ownKey: '',
          otherKey: ''
        })
      }
      this.$store.commit('setCurrentConversationId', normalizedNumber)
      this.$emit('push-page', Conversation)
    }
  }
}
</script>

<style scoped>
  .list-item__subtitle {
    width: 150px;
  }
  .list-item__label {
    font-size: 12px;
    overflow: visible;
    white-space: nowrap;
  }
  .list-item__icon.ion-ios-arrow-forward {
    color: #c7c7cc;
    font-size: 20px;
  }
  .countryCodeLabel {
    position: relative;
    top: 6px;
    margin-right: 5px;
    font-weight: bold;
    font-size: 14px;
  }
</style>
