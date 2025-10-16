<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Votre compte SPAT</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; border: 2px solid #e5e7eb; margin: 20px 0; }
        .warning { background: #fef3cd; border: 1px solid #fde68a; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SPAT - Gestion des Congés</h1>
            <p>Votre compte a été créé avec succès</p>
        </div>
        
        <div class="content">
            <h2>Bonjour {{ $employe->prenom }} {{ $employe->nom }},</h2>
            
            <p>Votre compte pour accéder au système de gestion des congés de SPAT a été créé.</p>
            
            <div class="credentials">
                <h3>Vos identifiants de connexion :</h3>
                <p><strong>Email :</strong> {{ $employe->user->email }}</p>
                <p><strong>Mot de passe temporaire :</strong> <code style="font-size: 18px; background: #f3f4f6; padding: 8px 12px; border-radius: 4px;">{{ $tempPassword }}</code></p>
            </div>
            
            <div class="warning">
                <h4>🛡️ Sécurité importante :</h4>
                <p>Pour des raisons de sécurité, vous devrez <strong>changer votre mot de passe</strong> lors de votre première connexion.</p>
            </div>
            
            <p>Pour accéder à votre compte, cliquez sur le bouton ci-dessous :</p>
            
            <p style="text-align: center;">
                <a href="{{ $loginUrl }}" class="button">Se connecter à mon compte</a>
            </p>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="{{ $loginUrl }}">{{ $loginUrl }}</a></p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                <p>SPAT - Service des Ressources Humaines</p>
            </div>
        </div>
    </div>
</body>
</html>