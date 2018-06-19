import { ToolPanel } from 'substance'

export default class NodeMenu extends ToolPanel {
  getEntryTypeComponents () {
    return {
      'tool-group': this.getComponent('menu-group'),
      'tool-dropdown': this.getComponent('menu-group')
    }
  }

  render ($$) {
    let el = $$('div').addClass('sc-node-menu')
    el.append(this.renderEntries($$))
    return el
  }
}
