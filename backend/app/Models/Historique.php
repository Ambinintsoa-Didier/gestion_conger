<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Historique extends Model
{
    use HasFactory;

    protected $primaryKey = 'idHistorique';
    
    protected $table = 'historiques';

    protected $fillable = [
        'idUtilisateur',
        'action',
        'details'
    ];

    protected $casts = [
        'dateAction' => 'datetime',
    ];

    // Relation avec l'utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'idUtilisateur');
    }
}