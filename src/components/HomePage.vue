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
        <v-ons-toolbar-button @click="" v-if="canAccessContacts">
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
      <span slot="title">Welcome to Vernam!</span>
      Please enter your country and phone number to start texting.
      <br><br>
      <v-ons-select v-model="selectedCountryCode">
        <option disabled value="">Select your country</option>
        <option v-for="country in countries" :value="country.countryCode">
          {{ country.name }} (+{{ country.callingCode }})
        </option>
      </v-ons-select>
      <br><br>
      <v-ons-input placeholder="Phone number" float v-model="phoneNumber" type="tel"></v-ons-input>
      <template slot="footer">
        <div class="alert-dialog-button" @click="setIdentity()">Finished</div>
      </template>
    </v-ons-alert-dialog>
  </v-ons-page>
</template>

<script>
import OtpCrypto from 'otp-crypto'
import Settings from './Settings'
import Conversation from './Conversation'
import { parse, format } from 'libphonenumber-js'

export default {
  name: 'home',
  data () {
    return {
      searchText: '',
      canAccessContacts: false,
      selectedCountryCode: '',
      phoneNumber: null,
      countries: [{'countryCode': 'AF', 'name': 'Afghanistan', 'callingCode': '93'}, {'countryCode': 'AX', 'name': 'Aland Islands', 'callingCode': '+358-18'}, {'countryCode': 'AL', 'name': 'Albania', 'callingCode': '355'}, {'countryCode': 'DZ', 'name': 'Algeria', 'callingCode': '213'}, {'countryCode': 'AS', 'name': 'American Samoa', 'callingCode': '+1-684'}, {'countryCode': 'AD', 'name': 'Andorra', 'callingCode': '376'}, {'countryCode': 'AO', 'name': 'Angola', 'callingCode': '244'}, {'countryCode': 'AI', 'name': 'Anguilla', 'callingCode': '+1-264'}, {'countryCode': 'AQ', 'name': 'Antarctica', 'callingCode': ''}, {'countryCode': 'AG', 'name': 'Antigua and Barbuda', 'callingCode': '+1-268'}, {'countryCode': 'AR', 'name': 'Argentina', 'callingCode': '54'}, {'countryCode': 'AM', 'name': 'Armenia', 'callingCode': '374'}, {'countryCode': 'AW', 'name': 'Aruba', 'callingCode': '297'}, {'countryCode': 'AU', 'name': 'Australia', 'callingCode': '61'}, {'countryCode': 'AT', 'name': 'Austria', 'callingCode': '43'}, {'countryCode': 'AZ', 'name': 'Azerbaijan', 'callingCode': '994'}, {'countryCode': 'BS', 'name': 'Bahamas', 'callingCode': '+1-242'}, {'countryCode': 'BH', 'name': 'Bahrain', 'callingCode': '973'}, {'countryCode': 'BD', 'name': 'Bangladesh', 'callingCode': '880'}, {'countryCode': 'BB', 'name': 'Barbados', 'callingCode': '+1-246'}, {'countryCode': 'BY', 'name': 'Belarus', 'callingCode': '375'}, {'countryCode': 'BE', 'name': 'Belgium', 'callingCode': '32'}, {'countryCode': 'BZ', 'name': 'Belize', 'callingCode': '501'}, {'countryCode': 'BJ', 'name': 'Benin', 'callingCode': '229'}, {'countryCode': 'BM', 'name': 'Bermuda', 'callingCode': '+1-441'}, {'countryCode': 'BT', 'name': 'Bhutan', 'callingCode': '975'}, {'countryCode': 'BO', 'name': 'Bolivia', 'callingCode': '591'}, {'countryCode': 'BQ', 'name': 'Bonaire, Saint Eustatius and Saba ', 'callingCode': '599'}, {'countryCode': 'BA', 'name': 'Bosnia and Herzegovina', 'callingCode': '387'}, {'countryCode': 'BW', 'name': 'Botswana', 'callingCode': '267'}, {'countryCode': 'BV', 'name': 'Bouvet Island', 'callingCode': ''}, {'countryCode': 'BR', 'name': 'Brazil', 'callingCode': '55'}, {'countryCode': 'IO', 'name': 'British Indian Ocean Territory', 'callingCode': '246'}, {'countryCode': 'VG', 'name': 'British Virgin Islands', 'callingCode': '+1-284'}, {'countryCode': 'BN', 'name': 'Brunei', 'callingCode': '673'}, {'countryCode': 'BG', 'name': 'Bulgaria', 'callingCode': '359'}, {'countryCode': 'BF', 'name': 'Burkina Faso', 'callingCode': '226'}, {'countryCode': 'BI', 'name': 'Burundi', 'callingCode': '257'}, {'countryCode': 'KH', 'name': 'Cambodia', 'callingCode': '855'}, {'countryCode': 'CM', 'name': 'Cameroon', 'callingCode': '237'}, {'countryCode': 'CA', 'name': 'Canada', 'callingCode': '1'}, {'countryCode': 'CV', 'name': 'Cape Verde', 'callingCode': '238'}, {'countryCode': 'KY', 'name': 'Cayman Islands', 'callingCode': '+1-345'}, {'countryCode': 'CF', 'name': 'Central African Republic', 'callingCode': '236'}, {'countryCode': 'TD', 'name': 'Chad', 'callingCode': '235'}, {'countryCode': 'CL', 'name': 'Chile', 'callingCode': '56'}, {'countryCode': 'CN', 'name': 'China', 'callingCode': '86'}, {'countryCode': 'CX', 'name': 'Christmas Island', 'callingCode': '61'}, {'countryCode': 'CC', 'name': 'Cocos Islands', 'callingCode': '61'}, {'countryCode': 'CO', 'name': 'Colombia', 'callingCode': '57'}, {'countryCode': 'KM', 'name': 'Comoros', 'callingCode': '269'}, {'countryCode': 'CK', 'name': 'Cook Islands', 'callingCode': '682'}, {'countryCode': 'CR', 'name': 'Costa Rica', 'callingCode': '506'}, {'countryCode': 'HR', 'name': 'Croatia', 'callingCode': '385'}, {'countryCode': 'CU', 'name': 'Cuba', 'callingCode': '53'}, {'countryCode': 'CW', 'name': 'Curacao', 'callingCode': '599'}, {'countryCode': 'CY', 'name': 'Cyprus', 'callingCode': '357'}, {'countryCode': 'CZ', 'name': 'Czech Republic', 'callingCode': '420'}, {'countryCode': 'CD', 'name': 'Democratic Republic of the Congo', 'callingCode': '243'}, {'countryCode': 'DK', 'name': 'Denmark', 'callingCode': '45'}, {'countryCode': 'DJ', 'name': 'Djibouti', 'callingCode': '253'}, {'countryCode': 'DM', 'name': 'Dominica', 'callingCode': '+1-767'}, {'countryCode': 'DO', 'name': 'Dominican Republic', 'callingCode': '+1-809 and 1-829'}, {'countryCode': 'TL', 'name': 'East Timor', 'callingCode': '670'}, {'countryCode': 'EC', 'name': 'Ecuador', 'callingCode': '593'}, {'countryCode': 'EG', 'name': 'Egypt', 'callingCode': '20'}, {'countryCode': 'SV', 'name': 'El Salvador', 'callingCode': '503'}, {'countryCode': 'GQ', 'name': 'Equatorial Guinea', 'callingCode': '240'}, {'countryCode': 'ER', 'name': 'Eritrea', 'callingCode': '291'}, {'countryCode': 'EE', 'name': 'Estonia', 'callingCode': '372'}, {'countryCode': 'ET', 'name': 'Ethiopia', 'callingCode': '251'}, {'countryCode': 'FK', 'name': 'Falkland Islands', 'callingCode': '500'}, {'countryCode': 'FO', 'name': 'Faroe Islands', 'callingCode': '298'}, {'countryCode': 'FJ', 'name': 'Fiji', 'callingCode': '679'}, {'countryCode': 'FI', 'name': 'Finland', 'callingCode': '358'}, {'countryCode': 'FR', 'name': 'France', 'callingCode': '33'}, {'countryCode': 'GF', 'name': 'French Guiana', 'callingCode': '594'}, {'countryCode': 'PF', 'name': 'French Polynesia', 'callingCode': '689'}, {'countryCode': 'TF', 'name': 'French Southern Territories', 'callingCode': ''}, {'countryCode': 'GA', 'name': 'Gabon', 'callingCode': '241'}, {'countryCode': 'GM', 'name': 'Gambia', 'callingCode': '220'}, {'countryCode': 'GE', 'name': 'Georgia', 'callingCode': '995'}, {'countryCode': 'DE', 'name': 'Germany', 'callingCode': '49'}, {'countryCode': 'GH', 'name': 'Ghana', 'callingCode': '233'}, {'countryCode': 'GI', 'name': 'Gibraltar', 'callingCode': '350'}, {'countryCode': 'GR', 'name': 'Greece', 'callingCode': '30'}, {'countryCode': 'GL', 'name': 'Greenland', 'callingCode': '299'}, {'countryCode': 'GD', 'name': 'Grenada', 'callingCode': '+1-473'}, {'countryCode': 'GP', 'name': 'Guadeloupe', 'callingCode': '590'}, {'countryCode': 'GU', 'name': 'Guam', 'callingCode': '+1-671'}, {'countryCode': 'GT', 'name': 'Guatemala', 'callingCode': '502'}, {'countryCode': 'GG', 'name': 'Guernsey', 'callingCode': '+44-1481'}, {'countryCode': 'GN', 'name': 'Guinea', 'callingCode': '224'}, {'countryCode': 'GW', 'name': 'Guinea-Bissau', 'callingCode': '245'}, {'countryCode': 'GY', 'name': 'Guyana', 'callingCode': '592'}, {'countryCode': 'HT', 'name': 'Haiti', 'callingCode': '509'}, {'countryCode': 'HM', 'name': 'Heard Island and McDonald Islands', 'callingCode': ' '}, {'countryCode': 'HN', 'name': 'Honduras', 'callingCode': '504'}, {'countryCode': 'HK', 'name': 'Hong Kong', 'callingCode': '852'}, {'countryCode': 'HU', 'name': 'Hungary', 'callingCode': '36'}, {'countryCode': 'IS', 'name': 'Iceland', 'callingCode': '354'}, {'countryCode': 'IN', 'name': 'India', 'callingCode': '91'}, {'countryCode': 'ID', 'name': 'Indonesia', 'callingCode': '62'}, {'countryCode': 'IR', 'name': 'Iran', 'callingCode': '98'}, {'countryCode': 'IQ', 'name': 'Iraq', 'callingCode': '964'}, {'countryCode': 'IE', 'name': 'Ireland', 'callingCode': '353'}, {'countryCode': 'IM', 'name': 'Isle of Man', 'callingCode': '+44-1624'}, {'countryCode': 'IL', 'name': 'Israel', 'callingCode': '972'}, {'countryCode': 'IT', 'name': 'Italy', 'callingCode': '39'}, {'countryCode': 'CI', 'name': 'Ivory Coast', 'callingCode': '225'}, {'countryCode': 'JM', 'name': 'Jamaica', 'callingCode': '+1-876'}, {'countryCode': 'JP', 'name': 'Japan', 'callingCode': '81'}, {'countryCode': 'JE', 'name': 'Jersey', 'callingCode': '+44-1534'}, {'countryCode': 'JO', 'name': 'Jordan', 'callingCode': '962'}, {'countryCode': 'KZ', 'name': 'Kazakhstan', 'callingCode': '7'}, {'countryCode': 'KE', 'name': 'Kenya', 'callingCode': '254'}, {'countryCode': 'KI', 'name': 'Kiribati', 'callingCode': '686'}, {'countryCode': 'XK', 'name': 'Kosovo', 'callingCode': ''}, {'countryCode': 'KW', 'name': 'Kuwait', 'callingCode': '965'}, {'countryCode': 'KG', 'name': 'Kyrgyzstan', 'callingCode': '996'}, {'countryCode': 'LA', 'name': 'Laos', 'callingCode': '856'}, {'countryCode': 'LV', 'name': 'Latvia', 'callingCode': '371'}, {'countryCode': 'LB', 'name': 'Lebanon', 'callingCode': '961'}, {'countryCode': 'LS', 'name': 'Lesotho', 'callingCode': '266'}, {'countryCode': 'LR', 'name': 'Liberia', 'callingCode': '231'}, {'countryCode': 'LY', 'name': 'Libya', 'callingCode': '218'}, {'countryCode': 'LI', 'name': 'Liechtenstein', 'callingCode': '423'}, {'countryCode': 'LT', 'name': 'Lithuania', 'callingCode': '370'}, {'countryCode': 'LU', 'name': 'Luxembourg', 'callingCode': '352'}, {'countryCode': 'MO', 'name': 'Macao', 'callingCode': '853'}, {'countryCode': 'MK', 'name': 'Macedonia', 'callingCode': '389'}, {'countryCode': 'MG', 'name': 'Madagascar', 'callingCode': '261'}, {'countryCode': 'MW', 'name': 'Malawi', 'callingCode': '265'}, {'countryCode': 'MY', 'name': 'Malaysia', 'callingCode': '60'}, {'countryCode': 'MV', 'name': 'Maldives', 'callingCode': '960'}, {'countryCode': 'ML', 'name': 'Mali', 'callingCode': '223'}, {'countryCode': 'MT', 'name': 'Malta', 'callingCode': '356'}, {'countryCode': 'MH', 'name': 'Marshall Islands', 'callingCode': '692'}, {'countryCode': 'MQ', 'name': 'Martinique', 'callingCode': '596'}, {'countryCode': 'MR', 'name': 'Mauritania', 'callingCode': '222'}, {'countryCode': 'MU', 'name': 'Mauritius', 'callingCode': '230'}, {'countryCode': 'YT', 'name': 'Mayotte', 'callingCode': '262'}, {'countryCode': 'MX', 'name': 'Mexico', 'callingCode': '52'}, {'countryCode': 'FM', 'name': 'Micronesia', 'callingCode': '691'}, {'countryCode': 'MD', 'name': 'Moldova', 'callingCode': '373'}, {'countryCode': 'MC', 'name': 'Monaco', 'callingCode': '377'}, {'countryCode': 'MN', 'name': 'Mongolia', 'callingCode': '976'}, {'countryCode': 'ME', 'name': 'Montenegro', 'callingCode': '382'}, {'countryCode': 'MS', 'name': 'Montserrat', 'callingCode': '+1-664'}, {'countryCode': 'MA', 'name': 'Morocco', 'callingCode': '212'}, {'countryCode': 'MZ', 'name': 'Mozambique', 'callingCode': '258'}, {'countryCode': 'MM', 'name': 'Myanmar', 'callingCode': '95'}, {'countryCode': 'NA', 'name': 'Namibia', 'callingCode': '264'}, {'countryCode': 'NR', 'name': 'Nauru', 'callingCode': '674'}, {'countryCode': 'NP', 'name': 'Nepal', 'callingCode': '977'}, {'countryCode': 'NL', 'name': 'Netherlands', 'callingCode': '31'}, {'countryCode': 'NC', 'name': 'New Caledonia', 'callingCode': '687'}, {'countryCode': 'NZ', 'name': 'New Zealand', 'callingCode': '64'}, {'countryCode': 'NI', 'name': 'Nicaragua', 'callingCode': '505'}, {'countryCode': 'NE', 'name': 'Niger', 'callingCode': '227'}, {'countryCode': 'NG', 'name': 'Nigeria', 'callingCode': '234'}, {'countryCode': 'NU', 'name': 'Niue', 'callingCode': '683'}, {'countryCode': 'NF', 'name': 'Norfolk Island', 'callingCode': '672'}, {'countryCode': 'KP', 'name': 'North Korea', 'callingCode': '850'}, {'countryCode': 'MP', 'name': 'Northern Mariana Islands', 'callingCode': '+1-670'}, {'countryCode': 'NO', 'name': 'Norway', 'callingCode': '47'}, {'countryCode': 'OM', 'name': 'Oman', 'callingCode': '968'}, {'countryCode': 'PK', 'name': 'Pakistan', 'callingCode': '92'}, {'countryCode': 'PW', 'name': 'Palau', 'callingCode': '680'}, {'countryCode': 'PS', 'name': 'Palestinian Territory', 'callingCode': '970'}, {'countryCode': 'PA', 'name': 'Panama', 'callingCode': '507'}, {'countryCode': 'PG', 'name': 'Papua New Guinea', 'callingCode': '675'}, {'countryCode': 'PY', 'name': 'Paraguay', 'callingCode': '595'}, {'countryCode': 'PE', 'name': 'Peru', 'callingCode': '51'}, {'countryCode': 'PH', 'name': 'Philippines', 'callingCode': '63'}, {'countryCode': 'PN', 'name': 'Pitcairn', 'callingCode': '870'}, {'countryCode': 'PL', 'name': 'Poland', 'callingCode': '48'}, {'countryCode': 'PT', 'name': 'Portugal', 'callingCode': '351'}, {'countryCode': 'PR', 'name': 'Puerto Rico', 'callingCode': '+1-787 and 1-939'}, {'countryCode': 'QA', 'name': 'Qatar', 'callingCode': '974'}, {'countryCode': 'CG', 'name': 'Republic of the Congo', 'callingCode': '242'}, {'countryCode': 'RE', 'name': 'Reunion', 'callingCode': '262'}, {'countryCode': 'RO', 'name': 'Romania', 'callingCode': '40'}, {'countryCode': 'RU', 'name': 'Russia', 'callingCode': '7'}, {'countryCode': 'RW', 'name': 'Rwanda', 'callingCode': '250'}, {'countryCode': 'BL', 'name': 'Saint Barthelemy', 'callingCode': '590'}, {'countryCode': 'SH', 'name': 'Saint Helena', 'callingCode': '290'}, {'countryCode': 'KN', 'name': 'Saint Kitts and Nevis', 'callingCode': '+1-869'}, {'countryCode': 'LC', 'name': 'Saint Lucia', 'callingCode': '+1-758'}, {'countryCode': 'MF', 'name': 'Saint Martin', 'callingCode': '590'}, {'countryCode': 'PM', 'name': 'Saint Pierre and Miquelon', 'callingCode': '508'}, {'countryCode': 'VC', 'name': 'Saint Vincent and the Grenadines', 'callingCode': '+1-784'}, {'countryCode': 'WS', 'name': 'Samoa', 'callingCode': '685'}, {'countryCode': 'SM', 'name': 'San Marino', 'callingCode': '378'}, {'countryCode': 'ST', 'name': 'Sao Tome and Principe', 'callingCode': '239'}, {'countryCode': 'SA', 'name': 'Saudi Arabia', 'callingCode': '966'}, {'countryCode': 'SN', 'name': 'Senegal', 'callingCode': '221'}, {'countryCode': 'RS', 'name': 'Serbia', 'callingCode': '381'}, {'countryCode': 'SC', 'name': 'Seychelles', 'callingCode': '248'}, {'countryCode': 'SL', 'name': 'Sierra Leone', 'callingCode': '232'}, {'countryCode': 'SG', 'name': 'Singapore', 'callingCode': '65'}, {'countryCode': 'SX', 'name': 'Sint Maarten', 'callingCode': '599'}, {'countryCode': 'SK', 'name': 'Slovakia', 'callingCode': '421'}, {'countryCode': 'SI', 'name': 'Slovenia', 'callingCode': '386'}, {'countryCode': 'SB', 'name': 'Solomon Islands', 'callingCode': '677'}, {'countryCode': 'SO', 'name': 'Somalia', 'callingCode': '252'}, {'countryCode': 'ZA', 'name': 'South Africa', 'callingCode': '27'}, {'countryCode': 'GS', 'name': 'South Georgia and the South Sandwich Islands', 'callingCode': ''}, {'countryCode': 'KR', 'name': 'South Korea', 'callingCode': '82'}, {'countryCode': 'SS', 'name': 'South Sudan', 'callingCode': '211'}, {'countryCode': 'ES', 'name': 'Spain', 'callingCode': '34'}, {'countryCode': 'LK', 'name': 'Sri Lanka', 'callingCode': '94'}, {'countryCode': 'SD', 'name': 'Sudan', 'callingCode': '249'}, {'countryCode': 'SR', 'name': 'Suriname', 'callingCode': '597'}, {'countryCode': 'SJ', 'name': 'Svalbard and Jan Mayen', 'callingCode': '47'}, {'countryCode': 'SZ', 'name': 'Swaziland', 'callingCode': '268'}, {'countryCode': 'SE', 'name': 'Sweden', 'callingCode': '46'}, {'countryCode': 'CH', 'name': 'Switzerland', 'callingCode': '41'}, {'countryCode': 'SY', 'name': 'Syria', 'callingCode': '963'}, {'countryCode': 'TW', 'name': 'Taiwan', 'callingCode': '886'}, {'countryCode': 'TJ', 'name': 'Tajikistan', 'callingCode': '992'}, {'countryCode': 'TZ', 'name': 'Tanzania', 'callingCode': '255'}, {'countryCode': 'TH', 'name': 'Thailand', 'callingCode': '66'}, {'countryCode': 'TG', 'name': 'Togo', 'callingCode': '228'}, {'countryCode': 'TK', 'name': 'Tokelau', 'callingCode': '690'}, {'countryCode': 'TO', 'name': 'Tonga', 'callingCode': '676'}, {'countryCode': 'TT', 'name': 'Trinidad and Tobago', 'callingCode': '+1-868'}, {'countryCode': 'TN', 'name': 'Tunisia', 'callingCode': '216'}, {'countryCode': 'TR', 'name': 'Turkey', 'callingCode': '90'}, {'countryCode': 'TM', 'name': 'Turkmenistan', 'callingCode': '993'}, {'countryCode': 'TC', 'name': 'Turks and Caicos Islands', 'callingCode': '+1-649'}, {'countryCode': 'TV', 'name': 'Tuvalu', 'callingCode': '688'}, {'countryCode': 'VI', 'name': 'U.S. Virgin Islands', 'callingCode': '+1-340'}, {'countryCode': 'UG', 'name': 'Uganda', 'callingCode': '256'}, {'countryCode': 'UA', 'name': 'Ukraine', 'callingCode': '380'}, {'countryCode': 'AE', 'name': 'United Arab Emirates', 'callingCode': '971'}, {'countryCode': 'GB', 'name': 'United Kingdom', 'callingCode': '44'}, {'countryCode': 'US', 'name': 'United States', 'callingCode': '1'}, {'countryCode': 'UM', 'name': 'United States Minor Outlying Islands', 'callingCode': '1'}, {'countryCode': 'UY', 'name': 'Uruguay', 'callingCode': '598'}, {'countryCode': 'UZ', 'name': 'Uzbekistan', 'callingCode': '998'}, {'countryCode': 'VU', 'name': 'Vanuatu', 'callingCode': '678'}, {'countryCode': 'VA', 'name': 'Vatican', 'callingCode': '379'}, {'countryCode': 'VE', 'name': 'Venezuela', 'callingCode': '58'}, {'countryCode': 'VN', 'name': 'Vietnam', 'callingCode': '84'}, {'countryCode': 'WF', 'name': 'Wallis and Futuna', 'callingCode': '681'}, {'countryCode': 'EH', 'name': 'Western Sahara', 'callingCode': '212'}, {'countryCode': 'YE', 'name': 'Yemen', 'callingCode': '967'}, {'countryCode': 'ZM', 'name': 'Zambia', 'callingCode': '260'}, {'countryCode': 'ZW', 'name': 'Zimbabwe', 'callingCode': '263'}]
    }
  },
  created () {
    document.addEventListener('show', event => {
      if (event.target.matches('#home')) {
        this.$store.commit('setCurrentConversationId', null)
      }
    }, false)
    document.addEventListener('deviceready', event => {
      if (navigator.contacts) {
        this.canAccessContacts = true
      } else if (this.$store.state.conversations.length <= 0) {
        this.$store.commit('createConversation', {
          id: '+436641234567',
          name: 'John Doe',
          messages: [],
          message: '',
          newMessages: false,
          ownKey: OtpCrypto.encryptedDataConverter.bytesToBase64(Uint8Array.from([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5])),
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(Uint8Array.from([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1]))
        })
        this.$store.commit('createConversation', {
          id: '+436801234567',
          name: 'Daniel Geymayer',
          messages: [],
          message: '',
          newMessages: false,
          ownKey: OtpCrypto.encryptedDataConverter.bytesToBase64(Uint8Array.from([5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1])),
          otherKey: OtpCrypto.encryptedDataConverter.bytesToBase64(Uint8Array.from([1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5]))
        })
      }
    }, false)

    this.$http.get('http://ipinfo.io').then(response => {
      const countryCode = response.body.country
      if (this.countries.some(country => country.countryCode === countryCode)) {
        this.selectedCountryCode = countryCode
      }
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
    setIdentity () {
      if (!this.selectedCountryCode) {
        this.$ons.notification.toast('Please select a country.', {timeout: 1000})
        return
      }
      if (!this.phoneNumber) {
        this.$ons.notification.toast('Please enter a phone number.', {timeout: 1000})
        return
      }
      const normalizedNumber = this.normalizeNumber(this.phoneNumber, this.selectedCountryCode)
      if (!normalizedNumber) {
        this.$ons.notification.toast('Please enter a valid phone number.', {timeout: 1000})
        return
      }
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
    normalizeNumber (rawNumber, countryCode) {
      const possiblySlightlyCookedNumber = (rawNumber.substr(0, 2) === '00') ? '+' + rawNumber.substring(2) : rawNumber
      const parsedNumber = parse(possiblySlightlyCookedNumber, countryCode)
      if (Object.keys(parsedNumber).length === 0 && parsedNumber.constructor === Object) {
        return null
      }
      return format(parsedNumber.phone, parsedNumber.country, 'E.164')
    },
    showContactPicker () {
      navigator.contacts.pickContact(contact => {
        const normalizedPhoneNumbers = contact.phoneNumbers.map(phoneNumber => {
          const normalizedNumber = this.normalizeNumber(phoneNumber.value, this.selectedCountryCode)
          return normalizedNumber ? { value: normalizedNumber, type: phoneNumber.type } : null
        }).filter(normalizedNumber => normalizedNumber !== null)

        if (normalizedPhoneNumbers.length <= 0) {
          this.$ons.notification.toast('No (valid) numbers for this contact.', {timeout: 1000})
          this.showContactPicker()
          return
        }
        if (normalizedPhoneNumbers.length === 1) {
          this.createConversation(contact.displayName, normalizedPhoneNumbers[0].value)
          return
        }
        const buttons = normalizedPhoneNumbers.map(normalizedPhoneNumber => normalizedPhoneNumber.type.replace(/(^|\s)\S/g, l => l.toUpperCase()) + ' (' + normalizedPhoneNumber.value + ')')
        buttons.push('Cancel')
        this.$ons.openActionSheet({ buttons, title: 'Choose a number', cancelable: true }).then(numberIdx => {
          if (numberIdx === buttons.length) {
            return
          }
          this.createConversation(contact.displayName, normalizedPhoneNumbers[numberIdx].value)
        })
      }, err => {
        console.error('ERROR: ' + err)
      })
    },
    createConversation (name, normalizedNumber) {
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
</style>
