<?php
// app/Mail/EmployeAccountCreated.php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeAccountCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $employe;
    public $tempPassword;
    public $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($employe, $tempPassword)
    {
        $this->employe = $employe;
        $this->tempPassword = $tempPassword;
        $this->loginUrl = config('app.url') . '/login';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre compte SPAT - Gestion des Congés a été créé',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.employe-account-created',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}