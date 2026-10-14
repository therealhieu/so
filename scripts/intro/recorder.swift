// Records one Ghostty window to a QuickTime movie with ScreenCaptureKit.
// It runs as its own app bundle (built by scripts/record-intro.ts) so macOS
// grants Screen Recording to it, not to the terminal that runs the script.
//
//   SoRecorder --title <window title> --out <movie> --status <file> --stop <file>
//
// It writes `permission`, `no-window: <titles seen>`, `recording`, `done`, or
// `error: …` to the status file, and stops once the stop file exists.
import AppKit
import AVFoundation
import CoreGraphics
import CoreMedia
import Foundation
import ScreenCaptureKit

let ghostty = "com.mitchellh.ghostty"

func option(_ name: String) -> String {
  let args = CommandLine.arguments
  guard let i = args.firstIndex(of: name), i + 1 < args.count else {
    FileHandle.standardError.write("missing \(name)\n".data(using: .utf8)!)
    exit(2)
  }
  return args[i + 1]
}

let title = option("--title")
let out = URL(fileURLWithPath: option("--out"))
let statusPath = option("--status")
let stopPath = option("--stop")

func status(_ text: String) {
  try? (text + "\n").write(toFile: statusPath, atomically: true, encoding: .utf8)
}

final class Writer: NSObject, SCStreamOutput {
  let writer: AVAssetWriter
  let input: AVAssetWriterInput
  private var started = false

  init(url: URL, width: Int, height: Int) throws {
    try? FileManager.default.removeItem(at: url)
    writer = try AVAssetWriter(outputURL: url, fileType: .mov)
    input = AVAssetWriterInput(
      mediaType: .video,
      outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 40_000_000],
      ])
    input.expectsMediaDataInRealTime = true
    writer.add(input)
    writer.startWriting()
  }

  func stream(
    _ stream: SCStream, didOutputSampleBuffer buffer: CMSampleBuffer,
    of type: SCStreamOutputType
  ) {
    guard type == .screen, buffer.isValid,
      let infos = CMSampleBufferGetSampleAttachmentsArray(buffer, createIfNecessary: false)
        as? [[SCStreamFrameInfo: Any]],
      let raw = infos.first?[.status] as? Int,
      SCFrameStatus(rawValue: raw) == .complete
    else { return }
    if !started {
      writer.startSession(atSourceTime: buffer.presentationTimeStamp)
      started = true
    }
    if input.isReadyForMoreMediaData { input.append(buffer) }
  }
}

/// The Ghostty window whose title contains `title`, or the titles seen when none does.
func findWindow() async throws -> (SCWindow?, [String]) {
  var seen: [String] = []
  for _ in 0..<150 {
    let content = try await SCShareableContent.excludingDesktopWindows(
      true, onScreenWindowsOnly: true)
    let windows = content.windows.filter { $0.owningApplication?.bundleIdentifier == ghostty }
    if let window = windows.first(where: { ($0.title ?? "").contains(title) }) {
      return (window, [])
    }
    seen = windows.map { $0.title ?? "<untitled>" }
    try await Task.sleep(nanoseconds: 100_000_000)
  }
  return (nil, seen)
}

func record() async throws {
  let (found, seen) = try await findWindow()
  guard let window = found else {
    status("no-window: \(seen.joined(separator: " | "))")
    exit(1)
  }
  let filter = SCContentFilter(desktopIndependentWindow: window)
  let scale = CGFloat(filter.pointPixelScale)
  let config = SCStreamConfiguration()
  // H.264 needs even dimensions.
  config.width = Int(filter.contentRect.width * scale) / 2 * 2
  config.height = Int(filter.contentRect.height * scale) / 2 * 2
  config.minimumFrameInterval = CMTime(value: 1, timescale: 30)
  config.pixelFormat = kCVPixelFormatType_32BGRA
  config.showsCursor = false
  config.ignoreShadowsSingleWindow = true
  config.queueDepth = 8

  let writer = try Writer(url: out, width: config.width, height: config.height)
  let stream = SCStream(filter: filter, configuration: config, delegate: nil)
  try stream.addStreamOutput(
    writer, type: .screen, sampleHandlerQueue: DispatchQueue(label: "frames"))
  try await stream.startCapture()
  status("recording")

  while !FileManager.default.fileExists(atPath: stopPath) {
    try await Task.sleep(nanoseconds: 50_000_000)
  }
  try await stream.stopCapture()
  writer.input.markAsFinished()
  await writer.writer.finishWriting()
  if let error = writer.writer.error { throw error }
  status("done")
}

// ScreenCaptureKit needs a window-server connection, which AppKit sets up.
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)

if !CGPreflightScreenCaptureAccess() {
  // Shows the system prompt and lists the app under Screen Recording.
  _ = CGRequestScreenCaptureAccess()
  status("permission")
  exit(1)
}

Task {
  do {
    try await record()
    exit(0)
  } catch {
    status("error: \(error.localizedDescription)")
    exit(1)
  }
}
app.run()
