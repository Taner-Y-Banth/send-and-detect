
import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();


nstClient.addListener("open", () => {

    let timeoutId = null;
    const logName = `images_${Date.now()}.mcap`;

    nstClient.startLog(logName, ['images'], {
        header: { profile: 'images', library: 'nodejs-client test' },
        channels: [
            {
                schema: {
                    title: 'foxglove.CompressedImage',
                    type: 'object',
                    properties: {
                        timestamp: {
                            type: 'object',
                            title: 'time',
                            properties: {
                                sec: {
                                    type: 'integer',
                                    minimum: 0,
                                },
                                nsec: {
                                    type: 'integer',
                                    minimum: 0,
                                    maximum: 999999999,
                                },
                            },
                            description: 'Timestamp of image',
                        },
                        frame_id: {
                            type: 'string',
                            description:
                                'Frame of reference for the image. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.',
                        },
                        data: {
                            type: 'string',
                            contentEncoding: 'base64',
                            description: 'Compressed image data',
                        },
                        format: {
                            type: 'string',
                            description: 'Image format',
                        },
                    },
                },
                channel: {
                    topic: 'preprocessing',
                    messageEncoding: 'json',
                },
            }
        ],
    });
    nstClient.addSubscription('preprocessing', (msg) => {
        const timestamp = Date.now();
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            nstClient.finishLog(logName);
        }, 3000);
        nstClient.send('images', {
            data: msg.data,
            frame_id: `${timestamp}`,
            format: 'image/jpeg',
            timestamp,
        });
    });
});

console.log("nstrumenta connect");
nstClient.connect({ wsUrl, nodeWebSocket: ws });