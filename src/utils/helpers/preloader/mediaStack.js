import _ from 'lodash'
import { ImgPreloader, VidPreloader } from './preloader'
import { joinPaths, keysToObject, typedKeys } from '../../commonUtils.ts'
import { getBreakptKey } from '../../queryUtil'
import { FILE_EXT, MEDIA_SIZES, MEDIA_TYPES, getPreviewBreakptKey, isImg, isThumbnail, isVid } from './preloadUtils'
import breakpts from '../../../data/breakpoints.ts'

class MediaStack {
  constructor({ pageId, fileName, fileType, mediaType, isPoster, autoPlayConfig, loadVid, Preloader, nativeDimension }) {
    this.pageId = pageId
    this.fileName = fileName
    this.fileType = fileType
    this.mediaType = mediaType
    this.isPoster = isPoster
    this.nativeDimension = nativeDimension

    this.breakpts = typedKeys(breakpts)
    this.stackKeys = this.breakpts

    if (!isVid(fileType)) this.stackKeys.unshift(MEDIA_SIZES.desktopFallback)
    if (!this.isThumbnail) this.stackKeys.push(MEDIA_SIZES.max)

    this.stack = keysToObject(this.stackKeys, size => new Preloader(this._getPath(size), autoPlayConfig, loadVid))
    this.listeners = []
  }

  _getPath(size) {
    const rootPath = '/assets'
    const pagePath = joinPaths(rootPath, 'work', this.pageId, size)
    const thumbnailRootPath = [rootPath, MEDIA_TYPES.thumbnails, size]

    let paths
    if (this.isThumbnail)
      paths = !this.isPoster ?
        [...thumbnailRootPath, this.fileName] :
        [...thumbnailRootPath, MEDIA_TYPES.posters, this.fileName]
    else if (this.isPoster)
      paths = [pagePath, MEDIA_TYPES.posters, this.fileName]
    else paths = [pagePath, this.fileName]
    return joinPaths(...paths)
  }

  preloadFull() {
    const breakptKey = getBreakptKey()
    return this.stack[breakptKey].preload()
      .then(() => this._onFinished())
  }

  preloadMax() {
    return this.stack.max.preload()
      .then(() => this._onFinished())
  }

  _onFinished() {
    this.listeners.forEach(listener => listener())
  }

  addLoadListener(callback) {
    this.listeners.push(callback)
  }

  removeLoadListener(callback) {
    _.pull(this.listeners, callback)
  }

  get isThumbnail() {
    return isThumbnail(this.mediaType)
  }

  get loadedSizes() {
    const loadedMedia = _.pickBy(this.stack,
      media => isImg(this.fileType) ?
        media.isLoaded : media.loadCount >= 1)
    return typedKeys(loadedMedia)
  }
}

export class ImgStack extends MediaStack {
  constructor(props) {
    super({
      ...props,
      fileType: MEDIA_TYPES.images,
      Preloader: ImgPreloader
    })
  }

  preloadDesktopFallback() {
    return this.stack.desktopFallback.preload()
      .then(() => this._onFinished())
  }

  preloadPreview() {
    const previewKey = getPreviewBreakptKey()
    if (!previewKey) return
    return this.stack[previewKey].preload()
      .then(() => this._onFinished())
  }
}

export class VidStack extends MediaStack {
  constructor(props) {
    super({
      ...props,
      fileType: MEDIA_TYPES.videos,
      Preloader: VidPreloader
    })

    this.posterStack = new ImgStack({
      ...props,
      fileName: this.isThumbnail ? `${this.pageId}.webp` :
        this.fileName.replace(FILE_EXT.webm, FILE_EXT.webp),
      mediaType: this.isThumbnail ? MEDIA_TYPES.thumbnails : MEDIA_TYPES.images,
      isPoster: true
    })
  }
}