import { createI18n } from 'vue-i18n'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  interface ComponentCustomProperties {
    $t: createI18n,
  }
  const component: DefineComponent<object, object, any>
  export default component
}
