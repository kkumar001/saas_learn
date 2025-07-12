"use client";

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import soundwaves from '@/constants/soundwaves.json';
import { addToSessionHistory } from '@/lib/actions/companion.actions';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
    CONNECTING = 'CONNECTING',
    FINISHED = 'FINISHED',
}

const CompanionComponent = ({ companionId, subject, topic, name, voice, userName, userImage, style }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    };

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        const assistantOverride = {
            variableValues: {
                subject, topic, style
            },
            clientMessages: ['transcript'],
            serverMessages: [],
        }

        // @ts-expect-error to make it work
        vapi.start(configureAssistant(voice, style), assistantOverride);
    }

    useEffect(() => {
        if (lottieRef) {
            if (isSpeaking) {
                lottieRef.current?.play();
            }
            else {
                lottieRef.current?.stop();
            }
        }
    }, [isSpeaking, lottieRef]);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            addToSessionHistory(companionId);
        };
        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript }
                setMessages((prev) => [newMessage, ...prev]);
            }
        };
        const onSpeakStart = () => setIsSpeaking(true);
        const onSpeakEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => console.log('Error:', error.message);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeakStart);
        vapi.on('speech-end', onSpeakEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeakStart);
            vapi.off('speech-end', onSpeakEnd);
            vapi.off('error', onError);
        };

    }, [companionId]);

    return (
        <section className='flex flex-col h-[70vh]'>
            <section className='flex gap-8 max-sm:flex-col'>
                <div className="companion-section">
                    <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}>
                        <div
                            className={
                                cn(
                                    'absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-1001' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                                )
                            }>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className="max-sm:w-fit" />
                        </div>

                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className="companion-lottie"
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">{name}</p>
                </div>

                <div className='user-section'>
                    <div className='user-avatar'>
                        <Image
                            src={userImage}
                            alt={userName}
                            width={130}
                            height={130}
                            className='rounded-lg'
                        />
                        <p className='font-bold text-2xl'>
                            {userName}
                        </p>
                    </div>
                    <button className='btn-mic' onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                        <Image
                            src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
                            alt='mic'
                            width={36}
                            height={36}
                        />
                        <p className='max-sm:hidden'>
                            {isMuted ? 'Turn on Mircrophone' : 'Turn off Microphone'}
                        </p>
                    </button>

                    <button className={cn('rounded-lg py-2 cursor-pointer transition-colors w-full text-white',
                        callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
                        callStatus === CallStatus.CONNECTING && 'animate-pulse'
                    )}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                    >
                        {callStatus === CallStatus.ACTIVE ?
                            'End Session' :
                            callStatus === CallStatus.CONNECTING ?
                                "Connecting..." :
                                "Start Session"}
                    </button>
                </div>
            </section>

            <section className='transcript' style={{ minHeight: 200 }}>
                <div className='transcript-message no-scrollbar'>
                    {messages.map((message, index) => {
                        if (message.role === 'assistant') {
                            return (
                                <p key={index} className='max-sm:text-sm'>
                                    {name.split(' ')[0].replace('./[.,]/g ', '')}
                                    :
                                    {message.content}
                                </p>
                            )
                        } else {
                            return (
                                <p key={index} className='text-primary max-sm:text-sm'>
                                    {userName}
                                    :
                                    {message.content}
                                </p>
                            )
                        }
                    })}
                </div>
                <div className='transcript-fade' />
            </section>
        </section>
    )
}

export default CompanionComponent