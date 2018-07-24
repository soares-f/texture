import {
  Component, DefaultDOMElement, Highlights
} from 'substance'
import { Managed, createEditorContext } from '../../shared'
import ArticleEditorSession from '../ArticleEditorSession'
import ArticleAPI from '../ArticleAPI'
import TOCProvider from './TOCProvider'
import TOC from './TOC'

/*
  Note: an earlier implementation was based on this guy: https://github.com/substance/texture/blob/295e5d39d8d0e4b690ee8575a6d7576329a3844d/src/editor/util/AbstractWriter.js
*/
export default class ManuscriptEditor extends Component {
  constructor (...args) {
    super(...args)

    this.handleActions({
      tocEntrySelected: this._tocEntrySelected,
      switchContext: this._switchContext,
      executeCommand: this._executeCommand,
      toggleOverlay: this._toggleOverlay
    })

    this._initialize(this.props)
  }

  _initialize (props) {
    const { articleSession, config, archive } = props
    const editorSession = new ArticleEditorSession(articleSession.getDocument(), config, this)
    const api = new ArticleAPI(editorSession, config.getModelRegistry())
    this.editorSession = editorSession
    this.api = api
    this.exporter = this._getExporter()
    this.tocProvider = this._getTOCProvider()
    this.contentHighlights = new Highlights(articleSession.getDocument())
    this.context = Object.assign(createEditorContext(config, editorSession), {
      api,
      tocProvider: this.tocProvider,
      urlResolver: archive
    })

    // initial reduce etc.
    this.editorSession.initialize()
  }

  didMount () {
    this.tocProvider.on('toc:updated', this._showHideTOC, this)
    this._showHideTOC()
    this._restoreViewport()

    DefaultDOMElement.getBrowserWindow().on('resize', this._showHideTOC, this)
  }

  didUpdate () {
    this._showHideTOC()
    this._restoreViewport()
  }

  dispose () {
    const articleSession = this.props.articleSession
    const editorSession = this.editorSession

    this.tocProvider.off(this)
    articleSession.off(this)
    editorSession.dispose()
    DefaultDOMElement.getBrowserWindow().off(this)

    // Note: we need to clear everything, as the childContext
    // changes which is immutable
    this.empty()
  }

  getComponentRegistry () {
    return this.props.config.getComponentRegistry()
  }

  render ($$) {
    let el = $$('div').addClass('sc-editor')
    el.append(
      this._renderMainSection($$),
      this._renderContextPane($$)
    )
    return el
  }

  _renderTOCPane ($$) {
    let el = $$('div').addClass('se-toc-pane').ref('tocPane')
    el.append(
      $$('div').addClass('se-context-pane-content').append(
        $$(TOC)
      )
    )
    return el
  }

  _renderContextPane ($$) {
    // TODO: we need to revisit this
    // We have introduced this to be able to inject a shared context panel
    // in Stencila. However, ATM we try to keep the component
    // as modular as possible, and avoid these kind of things.
    if (this.props.contextComponent) {
      let el = $$('div').addClass('se-context-pane')
      el.append(
        $$('div').addClass('se-context-pane-content').append(
          this.props.contextComponent
        )
      )
      return el
    }
  }

  _renderMainSection ($$) {
    const WorkflowPane = this.getComponent('workflow-pane')
    const configurator = this._getConfigurator()
    let mainSection = $$('div').addClass('se-main-section')
    mainSection.append(
      this._renderToolbar($$),
      $$('div').addClass('se-editor-section').append(
        this._renderTOCPane($$),
        this._renderContentPanel($$)
      ).ref('editorSection'),
      $$(Managed(WorkflowPane), {
        toolPanel: configurator.getToolPanel('workflow'),
        bindings: ['commandStates']
      })
    )
    return mainSection
  }

  _renderContentPanel ($$) {
    const doc = this._getDocument()
    const configurator = this._getConfigurator()
    const article = doc.get('article')

    const ScrollPane = this.getComponent('scroll-pane')
    const ManuscriptComponent = this.getComponent('manuscript')
    const Overlay = this.getComponent('overlay')
    const ContextMenu = this.getComponent('context-menu')
    const Dropzones = this.getComponent('dropzones')

    let contentPanel = $$(ScrollPane, {
      tocProvider: this.tocProvider,
      // scrollbarType: 'substance',
      contextMenu: 'custom',
      scrollbarPosition: 'right',
      highlights: this.contentHighlights
    }).ref('contentPanel')

    contentPanel.append(
      $$(ManuscriptComponent, {
        node: article,
        disabled: this.props.disabled
      }).ref('article'),
      $$(Managed(Overlay), {
        toolPanel: configurator.getToolPanel('main-overlay'),
        theme: 'light',
        bindings: ['commandStates']
      }),
      $$(Managed(ContextMenu), {
        toolPanel: configurator.getToolPanel('context-menu'),
        theme: 'light',
        bindings: ['commandStates']
      }),
      $$(Dropzones)
    )
    return contentPanel
  }

  _renderToolbar ($$) {
    const Toolbar = this.getComponent('toolbar')
    let configurator = this._getConfigurator()
    return $$('div').addClass('se-toolbar-wrapper').append(
      $$(Managed(Toolbar), {
        toolPanel: configurator.getToolPanel('toolbar'),
        bindings: ['commandStates']
      }).ref('toolbar')
    )
  }

  getViewport () {
    return {
      x: this.refs.contentPanel.getScrollPosition()
    }
  }

  _getConfigurator () {
    return this.props.config
  }

  _getEditorSession () {
    return this.editorSession
  }

  _getDocument () {
    return this.props.articleSession.getDocument()
  }

  _executeCommand (name, params) {
    this.editorSession.executeCommand(name, params)
  }

  _restoreViewport () {
    const editorSession = this._getEditorSession()
    if (this.props.viewport) {
      this.refs.contentPanel.setScrollPosition(this.props.viewport.x)
    }
    // HACK: This should work without a timeout, however it seems that
    // Editor.didMount is called earlier than the didMounts of the different
    // surfaces which do the surface registering, required here.
    setTimeout(() => {
      // We also use this place to rerender the selection
      let focusedSurface = editorSession.getFocusedSurface()
      if (focusedSurface) {
        focusedSurface.rerenderDOMSelection()
      }
    })
  }

  _switchContext (state) {
    this.refs.contextSection.setState(state)
  }

  _tocEntrySelected (nodeId) {
    const node = this._getDocument().get(nodeId)
    const editorSession = this._getEditorSession()
    const nodeComponent = this.refs.contentPanel.find(`[data-id="${nodeId}"]`)
    if (nodeComponent) {
      // TODO: it needs to be easier to retrieve the surface
      let surface = nodeComponent.context.surface
      // There are cases when we can't set selection, e.g. for references
      if (surface) {
        editorSession.setSelection({
          type: 'property',
          path: node.getPath(),
          startOffset: 0,
          surfaceId: surface.id,
          containerId: surface.getContainerId()
        })
      }
      return this._scrollTo(nodeId)
    }
  }

  _scrollTo (nodeId) {
    this.refs.contentPanel.scrollTo(`[data-id="${nodeId}"]`)
  }

  _showHideTOC () {
    let editorSectionWidth = this.refs.editorSection.el.width
    if (!this._isTOCVisible() || editorSectionWidth < 960) {
      this.el.addClass('sm-compact')
    } else {
      this.el.removeClass('sm-compact')
    }
  }

  _isTOCVisible () {
    let entries = this.tocProvider.getEntries()
    return entries.length >= 2
  }

  _getExporter () {
    return this.context.exporter
  }

  _getTOCProvider () {
    let containerId = this._getBodyContainerId()
    return new TOCProvider(this.props.articleSession, { containerId: containerId })
  }

  _getBodyContainerId () {
    const doc = this._getDocument()
    let body = doc.find('body')
    return body.id
  }

  _toggleOverlay (overlayId) {
    const appState = this.context.appState
    if (appState.overlayId === overlayId) {
      appState.overlayId = null
    } else {
      appState.overlayId = overlayId
    }
    appState.propagateUpdates()
  }
}
