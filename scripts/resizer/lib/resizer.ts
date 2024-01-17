import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import _ from 'lodash'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import { globSync } from 'glob'
import chalk from 'chalk'
import BreakpointResizer from './breakptResizer'
import { BreakptConfig, ImgExtension, MediaOptions, MediaType, ResizePosterConfig, ResizerConfig, callbackType, dimensionType, vidExtensionRegex } from './resizerTypes'
import { mkdirIfNone, emptyDir, joinPaths, removeFile, parseMediaType, getExtension, mapPromises, sortFileNames } from '../../utils'
import { POSTER_SUBFOLDER } from './constants'

class Resizer<K extends string> {
  source: string
  breakptConfigs: BreakptConfig<K>[]
  destination: string
  breakptResizers: BreakpointResizer<K>[]
  allFileEntries: string[]
  mediaOptions: MediaOptions
  removeFilesAtDest: boolean
  exportPoster: boolean
  callback: callbackType
  constructor(
    source: string,
    breakptConfigs: BreakptConfig<K>[],
    {
      destination,
      mediaOptions = {},
      toParentFolder = true,
      removeFilesAtDest = true,
      exportPoster = true,
      callback = _.noop
    }: ResizerConfig = {}) {
    this.source = source
    this.breakptConfigs = breakptConfigs
    const parentFolder = path.dirname(source)
    this.destination = destination || (toParentFolder ? parentFolder : source)
    this.breakptResizers = breakptConfigs.map(config => new BreakpointResizer(
      source, config,
      {
        destination: this.destination,
        mediaOptions,
        removeFilesAtDest,
        exportPoster
      }
    ))
    this.allFileEntries = _.union(...this.breakptConfigs.map(config =>
      config.sizes.map(size => size[0])))

    this.mediaOptions = mediaOptions
    this.removeFilesAtDest = removeFilesAtDest
    this.exportPoster = exportPoster
    this.callback = callback
  }

  async init() {
    this.createPosterFolder()
    this.mapBreakpts(resizer => resizer.init())
    const mapAllEntries = async (fileEntry: string) => {
      const fileNames = globSync(this.getSubpath(fileEntry), { nodir: true }).sort(sortFileNames)
      await mapPromises(fileNames, async fileName => await this.resizeMedia(this.removeSubpath(fileName), fileEntry))
    }

    await mapPromises(this.allFileEntries, async fileEntry => await mapAllEntries(fileEntry))
  }

  private createPosterFolder() {
    const hasVid = !!this.allFileEntries.find(fileName =>
      parseMediaType(fileName) === MediaType.Video)
    if (hasVid && this.exportPoster) this.createFolder(POSTER_SUBFOLDER)
  }

  private async resizeMedia(fileName: string, fileEntry: string) {
    const type = parseMediaType(fileName)
    if (type === MediaType.Image) await this.resizeImg(fileName, fileEntry)
    else if (type === MediaType.Video) await this.resizeVid(fileName, fileEntry)
    else throw new Error(`${fileName} is not an approved file type.`)
  }

  private async resizeImg(fileName: string, fileEntry: string): Promise<void>
  private async resizeImg(fileName: string, fileEntry: string, posterConfig?: ResizePosterConfig): Promise<void>
  private async resizeImg(fileName: string, fileEntry: string, posterConfig?: ResizePosterConfig) {
    console.log(fileName, fileEntry)
    const imgPath = posterConfig ? fileName : this.getSubpath(fileName)
    const animated = getExtension(imgPath) === ImgExtension.Gif
    const imgObj = sharp(imgPath, { animated })
    const size = posterConfig ? posterConfig.vidSize :
      this.throwNoWidth(await imgObj.metadata(), fileName)

    await this.mapBreakpts(async resizer => await resizer.resizeImg(imgObj, {
      size,
      fileName: posterConfig ? posterConfig.vidFileName : fileName,
      fileEntry,
      isPoster: !!posterConfig
    }))

    this.log(imgPath)
    if (!posterConfig) this.callback(imgPath, size)
  }

  private async resizeVid(fileName: string, fileEntry: string) {
    const vidPath = this.getSubpath(fileName)
    const vidObj = ffmpeg({ source: vidPath, priority: 10 }).noAudio()
    const size = await new Promise<dimensionType>(resolve => {
      vidObj.ffprobe(async (_, { streams }) =>
        resolve(this.throwNoWidth(streams[0], fileName)))
    })

    const pngPosterPath = this.getScreenshotPath(vidPath)
    const webpPosterPath = this.getPosterPath(pngPosterPath)
    if (this.exportPoster) {
      await new Promise<null>(resolve => {
        removeFile(pngPosterPath)
        removeFile(webpPosterPath)

        ffmpeg(vidPath).screenshots({
          filename: path.basename(pngPosterPath),
          timestamps: [0],
          folder: this.getSubpath(POSTER_SUBFOLDER)
        }).on('end', async () => {
          await sharp(pngPosterPath)
            .webp(this.mediaOptions.webp)
            .toFile(webpPosterPath)
          fs.rmSync(pngPosterPath)
          resolve(null)
        })
      })

      this.resizeImg(webpPosterPath, fileEntry, {
        vidSize: size, vidFileName: fileName
      })
    }

    await this.mapBreakpts(async resizer => await resizer
      .resizeVideo(vidObj, { size, fileName, fileEntry }))

    const hasOutputs = _.some(this.breakptConfigs, { debugOnly: false })
    if (hasOutputs) await new Promise<null>(resolve =>
      vidObj.on('end', () => resolve(null)).run())

    this.log(vidPath)
    this.callback(vidPath, size)
  }

  private async generateDash(fileName: string, fileEntry: string) {
    const vidPath = this.getSubpath(fileName)
    const vidObj = ffmpeg(vidPath)
    const size = await new Promise<dimensionType>(resolve => {
      vidObj.ffprobe(async (_, { streams }) =>
        resolve(this.throwNoWidth(streams[0], fileName)))
    })

    exec('')

  }

  private getSubpath(...subpaths: (string | undefined)[]) {
    return joinPaths(this.source, ...subpaths)
  }

  private removeSubpath(fullPath: string) {
    const sourceRegex = new RegExp(`${this.source}/?`)
    return fullPath.replace(sourceRegex, '')
  }

  private createFolder(...subpaths: (string | undefined)[]) {
    const filePath = this.getSubpath(...subpaths)
    if (this.removeFilesAtDest) emptyDir(filePath)
    else mkdirIfNone(filePath)
  }

  private async mapBreakpts(callback: (resizer: BreakpointResizer<K>) => Promise<any> | void) {
    await mapPromises(this.breakptResizers, async resizer => await callback(resizer))
  }

  private log(fileName: string) {
    const color = parseMediaType(fileName) === MediaType.Image ? 'green' : 'cyan'
    console.log(`${chalk.gray('Resized: ')}${chalk[color](fileName)}`)
  }

  private getScreenshotPath(filename: string) {
    const regex = new RegExp(`(${vidExtensionRegex})$`)
    return joinPaths(
      path.dirname(filename),
      POSTER_SUBFOLDER,
      path.basename(filename).replace(regex, ImgExtension.Png)
    )
  }

  private getPosterPath(filename: string) {
    return filename.replace(ImgExtension.Png, ImgExtension.Webp)
  }

  private throwNoWidth(metadata: Partial<dimensionType>, fileName: string) {
    const { width, height, pageHeight } = metadata
    if (!width || !height) throw new Error(`Cannot read dimensions of ${fileName}.`)
    return { width, height: pageHeight ?? height }
  }
}

export default Resizer