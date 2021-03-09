/*
 *  Scribble for remark.js/xaringan
 *  Matthew T. Warkentin <warkentin@lunenfeld.ca>
 *  and Garrick Aden-Buie <garrick@adenbuie.com>
 */

/* global slideshow,fabric */

class Scribble {
  constructor (opts) {
    // User options
    this.opts = opts
    this.penColors = opts.pen_color || '#FF0000'
    this.currColor = this.penColors[0]
    this.penSize = opts.pen_size || 3
    this.eraserSize = opts.eraser_size || this.penSize * 10
    this.tolerance = this.eraserSize / 2
    // this.eraserColor = opts['eraser_color'] || 'rgba(0, 0, 0, 0.1)'
    this.transparent = 'rgba(0, 0, 0, 0)'

    // Fabric objects
    this.fabrics = null
    this.currFabric = null
    this.pathCache = []
    this.undo = this.undo.bind(this)
    this.redo = this.redo.bind(this)

    // State objects
    this.mouseDown = false
    this.drawMode = false
    this.eraseMode = false
    this.hideToolbox = true

    this.eraserCursorMovement = this.eraserCursorMovement.bind(this)
    this.eraserDetectErase = this.eraserDetectErase.bind(this)

    // Toolbox objects
    this.launchKey = 83 // "S" used to toggle toolbox/state
    this.toolBox = null
    this.drawBtn = null
    this.eraseBtn = null
    this.clearBtn = null
    this.colorPicker = null
    this.eraserCursor = null

    // Scribble initialization
    this.setPenColorCSSVariables(this.currColor)
    this.addCanvasToAllSlides()
    this.addCanvasHelpText()
    this.assembleToolbox()
    this.addToolboxToSlide()
    this.initEraserCursor()
    this.addToggleToolbox()
    this.resizeContent()

    this.addDrawing()
    this.addClearing()
    this.addErasing()

    // Scribble continuous updating
    slideshow.on('afterShowSlide', (slide) => {
      this.currFabric = this.fabrics[slide.getSlideIndex()]
      this.addToolboxToSlide()
      this.pathCache = []
    })
    slideshow.on(
      'beforeHideSlide',
      this.removeTransparentEraserPaths.bind(this)
    )
    window.addEventListener('resize', this.resizeContent.bind(this))
  }

  getVisibleSlide () {
    return document.querySelector('.remark-visible')
  }

  getVisibleSlideSize () {
    const slideSize = this.getVisibleSlide()
      .querySelector('.remark-slide-scaler')
      .getBoundingClientRect()
    return slideSize
  }

  getVisibleSlideScaleRatio () {
    const scaleRatio = this.getVisibleSlide().querySelector(
      '.remark-slide-scaler'
    ).style.transform
    return scaleRatio
  }

  getVisibleSlideCanvas () {
    return this.fabrics[slideshow.getCurrentSlideIndex()]
  }

  getVisibleSlideOuterContainer () {
    return this.getVisibleSlide().querySelector(
      '.xe-scribble'
    )
  }

  getVisibleSlideCanvasContainers () {
    return this.getVisibleSlide().querySelectorAll(
      '.xe-scribble__canvas__drawing'
    )
  }

  setPenColorCSSVariables (color) {
    const root = document.documentElement
    root.style.setProperty('--xe-scribble--button-draw-active-bg', color)
    root.style.setProperty(
      '--xe-scribble--button-draw-active-fg',
      this.pickContrastForegroundColor(color)
    )
    root.style.setProperty('--xe-scribble--pen-color', color)
  }

  createCanvas (id) {
    const slideSize = this.getVisibleSlideSize()

    const canvasDiv = document.createElement('div')
    canvasDiv.classList.add('xe-scribble')
    canvasDiv.style.width = slideSize.width
    canvasDiv.style.height = slideSize.height
    canvasDiv.style.left = slideSize.left + 'px'
    canvasDiv.style.top = slideSize.top + 'px'
    ;['mousedown', 'touchstart'].forEach((gesture) => {
      canvasDiv.addEventListener(gesture, this.mousedown.bind(this))
    })
    ;['mouseup', 'touchend'].forEach((gesture) => {
      canvasDiv.addEventListener(gesture, this.mouseup.bind(this))
    })

    const canvas = document.createElement('canvas')
    canvas.setAttribute('id', 'canvas' + id)
    canvas.classList.add('xe-scribble__canvas__drawing')
    canvas.setAttribute('width', slideSize.width)
    canvas.setAttribute('height', slideSize.height)

    canvasDiv.appendChild(canvas)

    return canvasDiv
  }

  addCanvasToAllSlides () {
    // Add <canvas> to slide container
    const nslides = slideshow.getSlideCount()
    let i = 0
    const slides = document.getElementsByClassName('remark-slide-container')
    slides.forEach((slide) => {
      if (i + 1 <= nslides) {
        const canvasDiv = this.createCanvas(i)
        slide.appendChild(canvasDiv)
        i += 1
      }
    })

    // Convert <canvas> to fabric.Canvas
    const allCanvases = document.querySelectorAll('.xe-scribble__canvas__drawing')
    this.fabrics = []
    allCanvases.forEach((el, index) => {
      this.fabrics[index] = new fabric.Canvas(el.id, {
        isDrawingMode: false,
        containerClass: 'xe-scribble__canvas'
      })
    })
    this.currFabric = this.fabrics[slideshow.getCurrentSlideIndex()]
  }

  resizeContent () {
    const scalerSize = document
      .querySelector('.remark-visible .remark-slide-scaler')
      .getBoundingClientRect()

    // Resize canvas container
    const outerContainers = document.querySelectorAll(
      '.xe-scribble'
    )
    outerContainers.forEach((div) => {
      div.style.width = scalerSize.width + 'px'
      div.style.height = scalerSize.height + 'px'
      div.style.left = scalerSize.left + 'px'
      div.style.top = scalerSize.top + 'px'
    })

    const scaleRatio = parseFloat(
      this.getVisibleSlideScaleRatio().match('\\d+.\\d+')
    )

    // Resize canvas itself
    this.fabrics.forEach((fab) => {
      fab.setWidth(scalerSize.width)
      fab.setHeight(scalerSize.height)
      fab.setZoom(scaleRatio)
    })

    // Reposition toolbox outside slides if there is extra space
    if ((window.innerWidth - scalerSize.width) / 2 >= 42) {
      this.toolBox.style.right = '-40px'
    } else {
      this.toolBox.style.right = '10px'
    }
  }

  createButton (id, name, title) {
    const btn = document.createElement('button')
    btn.classList.add('xe-scribble__button', 'xe-scribble__button__' + id)
    btn.innerHTML = this.svgs[name]
    btn.title = title || (name.slice(0, 1).toUpperCase() + name.slice(1))
    return btn
  }

  createColorPicker () {
    const colorPicker = document.createElement('input')
    colorPicker.setAttribute('id', 'xe-scribble__colorPicker')
    colorPicker.classList.add('xe-scribble__button')
    colorPicker.setAttribute('type', 'color')
    colorPicker.setAttribute('value', this.currColor)
    colorPicker.title = 'Choose Pen Color'
    return colorPicker
  }

  createToolbox () {
    this.toolBox = document.createElement('div')
    this.toolBox.classList = 'xe-scribble__tools'
  }

  rgbColorToHex (color) {
    // https://haacked.com/archive/2009/12/29/convert-rgb-to-hex.aspx/
    if (color.substr(0, 1) === '#') {
      return color
    }
    const digits = /rgb\((\d+), (\d+), (\d+)\)/.exec(color)

    const red = parseInt(digits[1])
    const green = parseInt(digits[2])
    const blue = parseInt(digits[3])

    const rgb = blue | (green << 8) | (red << 16)
    return '#' + rgb.toString(16).padStart(6, '0')
  }

  pickContrastForegroundColor (color, light, dark, threshold) {
    color = this.rgbColorToHex(color)

    // https://stackoverflow.com/a/41491220/2022615
    light = light || '#FFFFFF'
    dark = dark || '#000000'
    threshold = threshold || 145
    color = (color.charAt(0) === '#') ? color.substring(1, 7) : color
    const r = parseInt(color.substring(0, 2), 16) // hexToR
    const g = parseInt(color.substring(2, 4), 16) // hexToG
    const b = parseInt(color.substring(4, 6), 16) // hexToB
    const score = ((r * 0.299) + (g * 0.587) + (b * 0.114))
    return (score > threshold) ? dark : light
  }

  assembleToolbox () {
    this.createToolbox()

    // Build draw, erase, clear buttons
    this.drawBtn = this.createButton('draw', 'draw', 'Start Drawing (S)')
    this.eraseBtn = this.createButton('erase', 'eraser', 'Erase Lines')
    this.clearBtn = this.createButton('clear', 'trash', 'Clear This Slide')

    this.colorPicker = this.createColorPicker()
    this.colorPicker.addEventListener('input', () => {
      this.currColor = this.colorPicker.value
      if (this.drawMode) {
        this.currFabric.freeDrawingBrush.color = this.currColor
      }
      this.setPenColorCSSVariables(this.currColor)
    })

    ;[this.drawBtn, this.eraseBtn, this.clearBtn, this.colorPicker]
      .forEach((btn) => {
        this.toolBox.appendChild(btn)
      })

    ;['click', 'touchend'].forEach((action) => {
      this.toolBox.addEventListener(action, ev => ev.stopPropagation())
    })
  }

  addToolboxToSlide () {
    const canvasDiv = this.getVisibleSlideOuterContainer()
    canvasDiv.appendChild(this.toolBox)
    if (this.hideToolbox) {
      this.toolBox.classList.add('minimized')
    }
  }

  addToggleToolbox () {
    const self = this

    document.addEventListener('keydown', (ev) => {
      if (ev.keyCode === this.launchKey) {
        self.toggleToolbox()
      }
    })

    this.toolBox.addEventListener('mouseleave', function (ev) {
      if (self.drawMode | self.eraseMode) {
        return
      }
      self.minimizeTimeout = setTimeout(() => self.toggleToolbox(false), 2000)
    })

    this.toolBox.addEventListener('mouseenter', function (ev) {
      if (self.minimizeTimeout) {
        clearTimeout(self.minimizeTimeout)
      }
    })
  }

  toggleToolbox (show) {
    const isMinimized = this.toolBox.matches('.minimized')
    if (show && show === !isMinimized) return

    this.hideToolbox = !(show || isMinimized)
    this.toolBox.classList.toggle('minimized')

    if (this.hideToolbox) {
      this.toolBox.classList.add('minimized')
      if (this.drawMode) {
        this.drawBtn.click()
      } else if (this.eraseMode) {
        this.eraseBtn.click()
      }
    } else {
      this.toolBox.classList.remove('minimized')
      clearTimeout(this.minimizeTimeout)
      this.minimizeTimeout = null
      if (!this.drawMode) this.drawBtn.click()
    }
  }

  addCanvasHelpText () {
    const helpTable = document.querySelector(
      '.remark-help-content table.light-keys'
    )
    if (!helpTable) {
      console.error(
        'Could not find remark help table, has remark been initialized?'
      )
      return
    }
    const newRow = document.createElement('tr')
    newRow.innerHTML += '<td><span class="key">s</span></td>'
    newRow.innerHTML += '<td>Toggle scribble toolbox</td>'
    helpTable.append(newRow)
  }

  mousedown () {
    this.mouseDown = true
  }

  mouseup () {
    this.mouseDown = false
  }

  getCanvasPaths () {
    return this.currFabric.getObjects('path')
  }

  addDrawing () {
    const self = this
    ;['click', 'touchend'].forEach((gesture) => {
      this.drawBtn.addEventListener(gesture, (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        if (self.drawMode) {
          self.stopDrawing()
        } else {
          self.startDrawing()
        }
      })
    })
  }

  startDrawing () {
    slideshow.pause()
    this.toggleToolbox(true)

    this.drawMode = true
    this.eraseMode = false
    this.drawBtn.title = 'Stop Drawing (S)'

    this.currFabric.isDrawingMode = true
    this.currFabric.freeDrawingBrush.width = this.penSize
    this.currFabric.freeDrawingBrush.color = this.currColor
    this.currFabric.freeDrawingCursor = 'crosshair'

    const drawingCanvas = this.getVisibleSlideCanvasContainers()
    drawingCanvas.forEach((container) => {
      container.classList.add('active', 'draw')
    })

    document.addEventListener('keydown', this.undo)
    document.addEventListener('keydown', this.redo)

    document.removeEventListener('mousemove', this.eraserCursorMovement)
    document.removeEventListener('touchmove', this.eraserCursorMovement)

    this.eraserCursor.classList.add('hidden')
    this.drawBtn.classList.add('active')
    this.eraseBtn.classList.remove('active')
  }

  stopDrawing () {
    slideshow.resume()

    this.drawMode = false
    this.eraseMode = false
    this.drawBtn.title = 'Start Drawing (S)'

    const drawingCanvas = this.getVisibleSlideCanvasContainers()
    drawingCanvas.forEach((container) => {
      container.classList.remove('active', 'draw')
    })

    document.removeEventListener('keydown', this.undo)
    document.removeEventListener('keydown', this.redo)

    this.drawBtn.classList.remove('active')
    this.eraseBtn.classList.remove('active')
  }

  addClearing () {
    ;['click', 'touchend'].forEach((gesture) => {
      this.clearBtn.addEventListener(gesture, (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        this.clearCurrentCanvas()
      })
    })
  }

  clearCurrentCanvas () {
    this.currFabric.forEachObject((obj) => {
      this.currFabric.remove(obj)
    })
  }

  addErasing () {
    ;['click', 'touchend'].forEach((gesture) => {
      this.eraseBtn.addEventListener(gesture, (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        this.eraseMode ? this.stopErasing() : this.startErasing()
      })
    })
  }

  eraserColor () {
    const slide = this.getVisibleSlide().querySelector('.remark-slide-content')
    const slideBgColor = window
      .getComputedStyle(slide)
      .getPropertyValue('background-color')

    return this.pickContrastForegroundColor(
      slideBgColor,
      'rgba(255, 255, 255, 0.33)',
      'rgba(0, 0, 0, 0.33)'
    )
  }

  startErasing () {
    slideshow.pause()

    this.eraseMode = true
    this.drawMode = false
    this.eraseBtn.title = 'Stop Erasing'
    this.eraserCursor.classList.remove('hidden')
    this.eraserCursor.style.backgroundColor = this.eraserColor()
    this.colorPicker.classList.add('hidden')

    const outerDiv = this.getVisibleSlideOuterContainer()
    outerDiv.addEventListener('mousemove', this.eraserDetectErase)
    outerDiv.addEventListener('touchmove', this.eraserDetectErase)

    document.addEventListener('mousemove', this.eraserCursorMovement)
    document.addEventListener('touchmove', this.eraserCursorMovement)

    document.addEventListener('keydown', this.undo)
    document.addEventListener('keydown', this.redo)

    this.currFabric.isDrawingMode = true
    this.currFabric.freeDrawingBrush.width = this.tolerance
    this.currFabric.freeDrawingBrush.color = this.transparent
    this.currFabric.freeDrawingCursor = 'none'

    const drawingCanvas = this.getVisibleSlideCanvasContainers()
    drawingCanvas.forEach((container) => {
      container.classList.add('active', 'erase')
    })

    this.drawBtn.classList.remove('active')
    this.eraseBtn.classList.add('active')
  }

  stopErasing () {
    this.drawMode = false
    this.eraseMode = false
    this.eraserCursor.classList.add('hidden')
    this.eraseBtn.title = 'Erase Lines'

    const outerDiv = this.getVisibleSlideOuterContainer()
    outerDiv.removeEventListener('mousemove', this.eraserDetectErase)
    outerDiv.removeEventListener('touchmove', this.eraserDetectErase)

    document.removeEventListener('mousemove', this.eraserCursorMovement)
    document.removeEventListener('touchmove', this.eraserCursorMovement)

    document.removeEventListener('keydown', this.undo)
    document.removeEventListener('keydown', this.redo)

    const drawingCanvas = this.getVisibleSlideCanvasContainers()
    drawingCanvas.forEach((container) => {
      container.classList.remove('active', 'erase')
    })

    this.drawBtn.classList.remove('active')
    this.eraseBtn.classList.remove('active')

    slideshow.resume()
  }

  eraserDetectErase (ev) {
    if (this.mouseDown & this.eraseMode) {
      const xy = [
        this.currFabric.getPointer(ev).x,
        this.currFabric.getPointer(ev).y
      ]
      const objs = this.getCanvasPaths()
      const paths = objs.map((path) => {
        return path.path
      })

      const shouldRemove = paths.map((path) => {
        const toRemove = path.some((point) => {
          const xcond = Math.abs(point[1] - xy[0]) < this.tolerance
          const ycond = Math.abs(point[2] - xy[1]) < this.tolerance
          const both = xcond & ycond
          return both
        })
        return toRemove
      })

      const pathCache = this.pathCache
      const currFabric = this.currFabric

      objs.map(function (item, index) {
        if (shouldRemove[index]) {
          pathCache.push(item)
          currFabric.remove(item)
        }
      })
    }
  }

  removeTransparentEraserPaths () {
    this.currFabric.forEachObject((obj) => {
      if (obj.stroke === this.transparent) {
        this.currFabric.remove(obj)
      }
    })
  }

  initEraserCursor () {
    const slideArea = document.querySelector('.remark-slides-area')
    this.eraserCursor = document.createElement('div')
    this.eraserCursor.classList.add('xe-scribble__cursor__eraser', 'hidden')
    this.eraserCursor.style.width = this.eraserSize + 'px'
    this.eraserCursor.style.height = this.eraserSize + 'px'

    slideArea.appendChild(this.eraserCursor)
  }

  eraserCursorMovement (ev) {
    var pX
    var pY
    if (ev.type === 'mousemove') {
      pX = ev.pageX
      pY = ev.pageY
    } else if (ev.type === 'touchmove') {
      pX = ev.touches[0].pageX
      pY = ev.touches[0].pageY
    }
    this.eraserCursor.style.top = pY - this.tolerance + 'px'
    this.eraserCursor.style.left = pX - this.tolerance + 'px'
  }

  undo (ev) {
    if (ev.keyCode === 37) {
      this.removeTransparentEraserPaths()

      if (this.currFabric._objects.length === 0) return

      const removedPath = this.currFabric._objects.pop()
      this.pathCache.push(removedPath)
      this.currFabric.renderAll()
    }
  }

  redo (ev) {
    if (ev.keyCode === 39) {
      this.removeTransparentEraserPaths()

      if (this.pathCache.length === 0) return

      const addedPath = this.pathCache.pop()
      this.currFabric._objects.push(addedPath)
      this.currFabric.renderAll()
    }
  }
}

Scribble.prototype.svgs = {
  // https://phosphoricons.com/
  draw:
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" fill="#000000" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><path d="M92.68629,216H48a8,8,0,0,1-8-8V163.31371a8,8,0,0,1,2.34315-5.65686l120-120a8,8,0,0,1,11.3137,0l44.6863,44.6863a8,8,0,0,1,0,11.3137l-120,120A8,8,0,0,1,92.68629,216Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path><line x1="136" y1="64" x2="192" y2="120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="95.48882" y1="215.48882" x2="40.5088" y2="160.5088" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line></svg>',
  eraser:
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" fill="#000000" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><line x1="91.55018" y1="99.54921" x2="159.43243" y2="167.43146" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><path d="M216.00049,215.83348H72.07L34.98164,178.74517a16,16,0,0,1,0-22.62742L148.11873,42.98066a16,16,0,0,1,22.62741,0L216.001,88.2355a16,16,0,0,1,0,22.62742L111.03042,215.83347" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path></svg>',
  trash:
    '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" fill="#000000" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"></rect><line x1="215.99609" y1="56" x2="39.99609" y2="56.00005" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="104" y1="104" x2="104" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><line x1="152" y1="104" x2="152" y2="168" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line><path d="M199.99609,56.00005V208a8,8,0,0,1-8,8h-128a8,8,0,0,1-8-8v-152" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path><path d="M168,56V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></path></svg>'
}
