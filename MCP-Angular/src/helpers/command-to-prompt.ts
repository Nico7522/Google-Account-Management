import { Command } from '../app/shared/models/command-type';
import { PromptAndMessage } from '../app/shared/models/prompt-and-message-interface';

/**
 * Method to convert a command to a prompt.
 * @param command commad to convert to a prompt
 * @param userId id of the user
 * @returns the prompt corresponding to the command
 */
export function commandToPromptAndMessage(command: Command, userId?: string): PromptAndMessage {
  switch (command) {
    case '1':
      return {
        prompt: "Donne moi l'URL d'authentification pour accéder à mon compte Google. NE ME DONNE QUE LE LIEN RIEN D'AUTRE.",
        message: "Donne moi l'URL d'authentification pour accéder à mon compte Google."
      };
    case '2':
      return {
        prompt: 'Donne moi les 10 mails les plus récents. Voici mon id: ' + userId,
        message: 'Donne moi les 10 mails les plus récents.'
      };
    case '3':
      return {
        prompt: `Je veux me déconnecter. Voici mon id: ${userId}. Si il n'y a pas d'erreur, réponds "Déconnecté avec succès". Si il y a une erreur, réponds "Erreur lors de la déconnexion".`,
        message: 'Je veux me déconnecter'
      };
    default:
      return {
        prompt: 'Unknown command',
        message: 'Unknown command'
      };
  }
}
