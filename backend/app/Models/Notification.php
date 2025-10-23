<?php
// app/Models/Notification.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';
    protected $primaryKey = 'idNotification';

    protected $fillable = [
        'idUtilisateur',
        'titre',
        'message', 
        'type',
        'entite_liee',
        'entite_id',
        'est_lu',
        'lu_at'
    ];

    protected $casts = [
        'est_lu' => 'boolean',
        'lu_at' => 'datetime'
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'idUtilisateur', 'idUtilisateur');
    }
}