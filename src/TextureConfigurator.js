import {
  Configurator, flatten, forEach, Registry, platform
} from 'substance'
import { SwitchTextTypeCommand } from './kit'

export default class TextureConfigurator extends Configurator {
  constructor () {
    super()

    this.config.configurations = new Map()
    this.config.others = new Map()

    // TODO: document why this is necessary, beyond legacy reasons
    this._compiledToolPanels = {}
    // initialized lazily
    this._componentRegistry = null
  }

  createScope (name) {
    let ConfiguratorClass = this.constructor
    let subConfig = new ConfiguratorClass()
    this.config.configurations.set(name, subConfig)
    return subConfig
  }

  get (name) {
    return this.config.others.get(name)
  }

  set (name, value) {
    this.config.others.set(name, value)
  }

  getConfiguration (name) {
    return this.config.configurations[name]
  }

  getComponentRegistry () {
    if (!this._componentRegistry) {
      this._componentRegistry = super.getComponentRegistry()
    }
    return this._componentRegistry
  }

  getComponent (name) {
    return this.getComponentRegistry().get(name, 'strict')
  }

  addCommand (name, CommandClass, opts = {}) {
    super.addCommand(name, CommandClass, opts)
    if (opts.accelerator) {
      this.addKeyboardShortcut(opts.accelerator, { command: name })
    }
  }

  addToolPanel (name, spec) {
    this.config.toolPanels[name] = spec
  }

  getToolPanel (name, strict) {
    let toolPanelSpec = this.config.toolPanels[name]
    if (toolPanelSpec) {
      // return cache compiled tool-panels
      if (this._compiledToolPanels[name]) return this._compiledToolPanels[name]
      let toolPanel = toolPanelSpec.map(itemSpec => this._compileToolPanelItem(itemSpec))
      this._compiledToolPanels[name] = toolPanel
      return toolPanel
    } else if (strict) {
      throw new Error(`No toolpanel configured with name ${name}`)
    }
  }

  getCommands () {
    let commands = new Map()
    forEach(this.config.commands, (item, name) => {
      const Command = item.CommandClass
      let command = new Command(Object.assign({ name }, item.options))
      commands.set(name, command)
    })
    return commands
  }

  getCommandGroup (name) {
    let commandGroup = this.config.commandGroups[name]
    if (!commandGroup) {
      commandGroup = []
    }
    return commandGroup
  }

  getConverters (type) {
    // TODO: use a Map instead, then we do not need Registry here
    let registry = new Registry()
    forEach(this.config.converters[type], (Converter, type) => {
      registry.add(type, Converter)
    })
    return registry
  }

  // TODO: this should be a helper, if necessary at all
  addTextTypeTool (spec) {
    this.addCommand(spec.name, SwitchTextTypeCommand, {
      spec: spec.nodeSpec,
      commandGroup: 'text-types'
    })
    this.addIcon(spec.name, { 'fontawesome': spec.icon })
    this.addLabel(spec.name, spec.label)
    if (spec.accelerator) {
      this.addKeyboardShortcut(spec.accelerator, { command: spec.name })
    }
  }

  getKeyboardShortcuts () {
    return this.config.keyboardShortcuts
  }

  /*
    Allows lookup of a keyboard shortcut by command name
  */
  getKeyboardShortcutsByCommandName (commandName) {
    let keyboardShortcuts = {}
    this.config.keyboardShortcuts.forEach((entry) => {
      if (entry.spec.command) {
        let shortcut = entry.key.toUpperCase()

        if (platform.isMac) {
          shortcut = shortcut.replace(/CommandOrControl/i, '⌘')
          shortcut = shortcut.replace(/Ctrl/i, '^')
          shortcut = shortcut.replace(/Shift/i, '⇧')
          shortcut = shortcut.replace(/Enter/i, '↵')
          shortcut = shortcut.replace(/Alt/i, '⌥')
          shortcut = shortcut.replace(/\+/g, '')
        } else {
          shortcut = shortcut.replace(/CommandOrControl/i, 'Ctrl')
        }

        keyboardShortcuts[entry.spec.command] = shortcut
      }
    })
    return keyboardShortcuts[commandName]
  }

  _compileToolPanelItem (itemSpec) {
    let item = Object.assign({}, itemSpec)
    let type = itemSpec.type
    switch (type) {
      case 'command': {
        if (!itemSpec.name) throw new Error("'name' is required for type 'command'")
        break
      }
      case 'command-group':
        return this.getCommandGroup(itemSpec.name).map(commandName => {
          return {
            type: 'command',
            name: commandName
          }
        })
      case 'switcher':
      case 'prompt':
      case 'group':
      case 'dropdown':
        item.items = flatten(itemSpec.items.map(itemSpec => this._compileToolPanelItem(itemSpec)))
        break
      case 'separator':
      case 'spacer':
        break
      default:
        throw new Error('Unsupported tool panel item type: ' + type)
    }
    return item
  }
}
