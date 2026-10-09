package com.example.experiments.loader;

import com.example.experiments.entity.Author;
import com.example.experiments.entity.Book;
import com.example.experiments.repository.AuthorRepository;
import com.example.experiments.repository.BookRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class DataLoader implements CommandLineRunner {

    private final AuthorRepository authorRepository;
    private final BookRepository bookRepository;

    public DataLoader(AuthorRepository authorRepository, BookRepository bookRepository) {
        this.authorRepository = authorRepository;
        this.bookRepository = bookRepository;
    }

    @Override
    public void run(String... args) {
        if (authorRepository.count() > 0) {
            return; // already seeded
        }

        // 50 diverse, internationally renowned authors from over 20 countries
        List<Author> authors = authorRepository.saveAll(List.of(
                new Author(null, "Isaac Asimov", "USA", null),
                new Author(null, "Agatha Christie", "UK", null),
                new Author(null, "Haruki Murakami", "Japan", null),
                new Author(null, "Chimamanda Ngozi Adichie", "Nigeria", null),
                new Author(null, "Yuval Noah Harari", "Israel", null),
                new Author(null, "George Orwell", "UK", null),
                new Author(null, "J.R.R. Tolkien", "UK", null),
                new Author(null, "Gabriel Garcia Marquez", "Colombia", null),
                new Author(null, "Jane Austen", "UK", null),
                new Author(null, "Frank Herbert", "USA", null),
                new Author(null, "Philip K. Dick", "USA", null),
                new Author(null, "Stephen King", "USA", null),
                new Author(null, "Arthur Conan Doyle", "UK", null),
                new Author(null, "Mary Shelley", "UK", null),
                new Author(null, "Franz Kafka", "Czech Republic", null),
                new Author(null, "Virginia Woolf", "UK", null),
                new Author(null, "Albert Camus", "France", null),
                new Author(null, "Ursula K. Le Guin", "USA", null),
                new Author(null, "Brandon Sanderson", "USA", null),
                new Author(null, "Neil Gaiman", "UK", null),
                new Author(null, "Leo Tolstoy", "Russia", null),
                new Author(null, "Fyodor Dostoevsky", "Russia", null),
                new Author(null, "Victor Hugo", "France", null),
                new Author(null, "Alexandre Dumas", "France", null),
                new Author(null, "Jules Verne", "France", null),
                new Author(null, "Jorge Luis Borges", "Argentina", null),
                new Author(null, "Isabel Allende", "Chile", null),
                new Author(null, "Paulo Coelho", "Brazil", null),
                new Author(null, "Salman Rushdie", "India", null),
                new Author(null, "Arundhati Roy", "India", null),
                new Author(null, "Rabindranath Tagore", "India", null),
                new Author(null, "Kazuo Ishiguro", "UK", null),
                new Author(null, "Yukio Mishima", "Japan", null),
                new Author(null, "Osamu Dazai", "Japan", null),
                new Author(null, "Chinua Achebe", "Nigeria", null),
                new Author(null, "Wole Soyinka", "Nigeria", null),
                new Author(null, "Nadine Gordimer", "South Africa", null),
                new Author(null, "J.M. Coetzee", "South Africa", null),
                new Author(null, "Margaret Atwood", "Canada", null),
                new Author(null, "Alice Munro", "Canada", null),
                new Author(null, "James Joyce", "Ireland", null),
                new Author(null, "Oscar Wilde", "Ireland", null),
                new Author(null, "Hermann Hesse", "Germany", null),
                new Author(null, "Thomas Mann", "Germany", null),
                new Author(null, "Italo Calvino", "Italy", null),
                new Author(null, "Umberto Eco", "Italy", null),
                new Author(null, "Miguel de Cervantes", "Spain", null),
                new Author(null, "Stieg Larsson", "Sweden", null),
                new Author(null, "Jo Nesbo", "Norway", null),
                new Author(null, "Stanislaw Lem", "Poland", null)
        ));

        // 15 distinct genres
        String[] genrePool = {
                "Sci-Fi", "Mystery", "Fiction", "Non-Fiction", "History",
                "Dystopian", "Fantasy", "Classic", "Cyberpunk", "Horror",
                "Philosophy", "Thriller", "Biography", "Poetry", "Adventure"
        };

        // Base price options for realistic price distribution
        double[] priceTiers = {
                9.99, 12.50, 14.99, 16.95, 18.99, 21.50, 24.99, 27.95, 29.99, 32.50, 35.00, 39.99, 44.95, 49.99
        };

        // Real classic & iconic titles per author
        String[][] famousWorks = {
                { "Foundation", "Foundation and Empire", "Second Foundation", "I, Robot", "The Caves of Steel", "The Naked Sun", "The Gods Themselves", "Nemesis", "Nightfall", "Prelude to Foundation" },
                { "And Then There Were None", "Murder on the Orient Express", "The Murder of Roger Ackroyd", "Death on the Nile", "The ABC Murders", "Crooked House", "The Mysterious Affair at Styles", "Peril at End House", "Five Little Pigs", "Cards on the Table" },
                { "Norwegian Wood", "Kafka on the Shore", "1Q84", "The Wind-Up Bird Chronicle", "Hard-Boiled Wonderland", "South of the Border", "Colorless Tsukuru Tazaki", "Killing Commendatore", "Men Without Women", "After Dark" },
                { "Half of a Yellow Sun", "Americanah", "Purple Hibiscus", "We Should All Be Feminists", "Dear Ijeawele", "The Thing Around Your Neck", "Notes on Grief", "For Love of Biafra", "Zik's Vision", "Echoes of Nsukka" },
                { "Sapiens: A Brief History of Humankind", "Homo Deus", "21 Lessons for the 21st Century", "Nexus: Information Networks", "Money", "Special Operations", "The Ultimate Experience", "Renaissance Military", "Dawn of Cognition", "AI Frontier" },
                { "1984", "Animal Farm", "Homage to Catalonia", "Down and Out in Paris and London", "Burmese Days", "Keep the Aspidistra Flying", "Coming Up for Air", "The Road to Wigan Pier", "Shooting an Elephant", "Politics and Language" },
                { "The Hobbit", "The Fellowship of the Ring", "The Two Towers", "The Return of the King", "The Silmarillion", "The Children of Hurin", "Beren and Luthien", "The Fall of Gondolin", "Unfinished Tales", "Tales from the Realm" },
                { "One Hundred Years of Solitude", "Love in the Time of Cholera", "Chronicle of a Death Foretold", "Autumn of the Patriarch", "No One Writes to the Colonel", "Of Love and Other Demons", "The General in His Labyrinth", "Strange Pilgrims", "Leaf Storm", "In Evil Hour" },
                { "Pride and Prejudice", "Sense and Sensibility", "Emma", "Persuasion", "Mansfield Park", "Northanger Abbey", "Lady Susan", "The Watsons", "Sanditon", "Love and Freindship" },
                { "Dune", "Dune Messiah", "Children of Dune", "God Emperor of Dune", "Heretics of Dune", "Chapterhouse: Dune", "The Dosadi Experiment", "Destination: Void", "The Jesus Incident", "The Lazarus Effect" },
                { "Do Androids Dream of Electric Sheep?", "Ubik", "A Scanner Darkly", "The Man in the High Castle", "VALIS", "Flow My Tears", "Solar Lottery", "Three Stigmata", "Martian Time-Slip", "Dr. Bloodmoney" },
                { "The Shining", "It", "Misery", "Carrie", "Salem's Lot", "The Stand", "Pet Sematary", "The Dark Tower", "11/22/63", "The Green Mile" },
                { "A Study in Scarlet", "The Sign of the Four", "The Hound of the Baskervilles", "The Valley of Fear", "Adventures of Sherlock Holmes", "Memoirs of Sherlock Holmes", "Return of Sherlock Holmes", "His Last Bow", "Case-Book of Sherlock Holmes", "The Lost World" },
                { "Frankenstein", "The Last Man", "Mathilda", "Valperga", "Lodore", "Falkner", "Perkin Warbeck", "Proserpine", "Rambles in Germany", "Maurice" },
                { "The Metamorphosis", "The Trial", "The Castle", "Amerika", "In the Penal Colony", "A Hunger Artist", "Letters to Milena", "Letter to His Father", "The Great Wall", "A Country Doctor" },
                { "Mrs Dalloway", "To the Lighthouse", "Orlando", "A Room of One's Own", "The Waves", "Between the Acts", "Night and Day", "Jacob's Room", "The Years", "The Voyage Out" },
                { "The Stranger", "The Myth of Sisyphus", "The Plague", "The Fall", "The Rebel", "Exile and the Kingdom", "A Happy Death", "The First Man", "Caligula", "The Misunderstanding" },
                { "The Left Hand of Darkness", "The Dispossessed", "A Wizard of Earthsea", "The Tombs of Atuan", "The Farthest Shore", "Tehanu", "The Lathe of Heaven", "Always Coming Home", "Word for World is Forest", "Lavinia" },
                { "Mistborn: The Final Empire", "The Well of Ascension", "The Hero of Ages", "The Way of Kings", "Words of Radiance", "Oathbringer", "Rhythm of War", "Elantris", "Warbreaker", "The Alloy of Law" },
                { "American Gods", "Coraline", "Good Omens", "The Sandman", "Neverwhere", "Stardust", "The Graveyard Book", "Ocean at the End of Lane", "Norse Mythology", "Anansi Boys" },
                { "War and Peace", "Anna Karenina", "The Death of Ivan Ilyich", "Resurrection", "Childhood", "Boyhood", "Youth", "The Cossacks", "Kreutzer Sonata", "Hadji Murat" },
                { "Crime and Punishment", "The Brothers Karamazov", "The Idiot", "Demons", "Notes from Underground", "The House of the Dead", "The Gambler", "Poor Folk", "The Double", "White Nights" },
                { "Les Miserables", "The Hunchback of Notre-Dame", "The Man Who Laughs", "Toilers of the Sea", "Ninety-Three", "The Last Day of a Condemned Man", "Odes and Ballads", "The Legend of the Ages", "Ruy Blas", "Cromwell" },
                { "The Count of Monte Cristo", "The Three Musketeers", "Twenty Years After", "The Vicomte of Bragelonne", "The Black Tulip", "La Reine Margot", "The Knight of Maison-Rouge", "Georges", "The Corsican Brothers", "Captain Paul" },
                { "Twenty Thousand Leagues Under the Sea", "Journey to the Center of the Earth", "Around the World in Eighty Days", "From the Earth to the Moon", "The Mysterious Island", "Five Weeks in a Balloon", "Michael Strogoff", "Master of the World", "Robur the Conqueror", "In Search of the Castaways" },
                { "Ficciones", "The Aleph", "Labyrinths", "The Book of Sand", "Inquisitions", "A Universal History of Iniquity", "Dreamtigers", "Brodie's Report", "The Gold of the Tigers", "Seven Nights" },
                { "The House of the Spirits", "Eva Luna", "Of Love and Shadows", "Paula", "In the Midst of Winter", "The Japanese Lover", "Daughter of Fortune", "Portrait in Sepia", "Zorro", "A Long Petal of the Sea" },
                { "The Alchemist", "Brida", "The Valkyries", "By the River Piedra", "Veronika Decides to Die", "The Devil and Miss Prym", "Eleven Minutes", "The Zahir", "The Witch of Portobello", "Adultery" },
                { "Midnight's Children", "The Satanic Verses", "Shame", "The Moor's Last Sigh", "Fury", "The Ground Beneath Her Feet", "Shalimar the Clown", "Two Years Eight Months", "Quichotte", "Victory City" },
                { "The God of Small Things", "The Ministry of Utmost Happiness", "An Ordinary Person's Guide to Empire", "The Algebra of Infinite Justice", "Listening to Grasshoppers", "Capitalism: A Ghost Story", "Things That Can and Cannot Be Said", "My Seditious Heart", "Azadi", "The End of Imagination" },
                { "Gitanjali", "The Home and the World", "Gora", "Chokher Bali", "The Post Office", "Kabuliwala", "Sadhana", "The Crescent Moon", "The Gardener", "Stray Birds" },
                { "Never Let Me Go", "The Remains of the Day", "Klara and the Sun", "The Buried Giant", "When We Were Orphans", "The Unconsoled", "An Artist of the Floating World", "A Pale View of Hills", "Nocturnes", "The White Countess" },
                { "The Temple of the Golden Pavilion", "Confessions of a Mask", "The Sound of Waves", "Sun and Steel", "Spring Snow", "Runaway Horses", "The Temple of Dawn", "The Decay of the Angel", "The Sailor Who Fell from Grace", "Patriotism" },
                { "No Longer Human", "The Setting Sun", "Run, Melos!", "Schoolgirl", "The Flowers of Buffoonery", "Return to Tsugaru", "Otogizoshi", "Blue Bamboo", "A Shameful Life", "Early Light" },
                { "Things Fall Apart", "No Longer at Ease", "Arrow of God", "A Man of the People", "Anthills of the Savannah", "Beware, Soul Brother", "Home and Exile", "Morning Yet on Creation Day", "The Trouble with Nigeria", "There Was a Country" },
                { "Death and the King's Horseman", "The Interpreters", "A Dance of the Forests", "The Lion and the Jewel", "Kongi's Harvest", "Season of Anomy", "Ake: The Years of Childhood", "You Must Set Forth at Dawn", "The Man Died", "Chronicles from the Land of the Happiest People" },
                { "Burger's Daughter", "July's People", "The Conservationist", "A Guest of Honour", "A Sport of Nature", "My Son's Story", "None to Accompany Me", "The Pickup", "Get a Life", "No Time Like the Present" },
                { "Disgrace", "Waiting for the Barbarians", "Life & Times of Michael K", "Foe", "The Master of Petersburg", "Age of Iron", "Slow Man", "Diary of a Bad Year", "The Childhood of Jesus", "The Schooldays of Jesus" },
                { "The Handmaid's Tale", "The Testaments", "Alias Grace", "Cat's Eye", "The Blind Assassin", "Oryx and Crake", "The Year of the Flood", "MaddAddam", "The Heart Goes Last", "Stone Mattress" },
                { "Dear Life", "Too Much Happiness", "Runaway", "Hateship, Friendship, Courtship", "The Love of a Good Woman", "Selected Stories", "Friend of My Youth", "The Moons of Jupiter", "Lives of Girls and Women", "Dance of the Happy Shades" },
                { "Ulysses", "A Portrait of the Artist as a Young Man", "Dubliners", "Finnegans Wake", "Exiles", "Chamber Music", "Pomes Penyeach", "Stephen Hero", "Giacomo Joyce", "The Cat and the Devil" },
                { "The Picture of Dorian Gray", "The Importance of Being Earnest", "De Profundis", "The Canterville Ghost", "The Happy Prince", "Salome", "Lady Windermere's Fan", "A Woman of No Importance", "An Ideal Husband", "The Ballad of Reading Gaol" },
                { "Siddhartha", "Steppenwolf", "The Glass Bead Game", "Demian", "Narcissus and Goldmund", "Peter Camenzind", "Rosshalde", "Knulp", "Beneath the Wheel", "Klingsor's Last Summer" },
                { "The Magic Mountain", "Death in Venice", "Buddenbrooks", "Doctor Faustus", "Joseph and His Brothers", "Confessions of Felix Krull", "Tonio Kroger", "Tristan", "Mario and the Magician", "Lotte in Weimar" },
                { "Invisible Cities", "If on a winter's night a traveler", "The Baron in the Trees", "The Cloven Viscount", "The Nonexistent Knight", "Cosmicomics", "Marcovaldo", "Mr. Palomar", "Italian Folktales", "Six Memos for the Next Millennium" },
                { "The Name of the Rose", "Foucault's Pendulum", "The Island of the Day Before", "Baudolino", "The Mysterious Flame of Queen Loana", "The Prague Cemetery", "Numero Zero", "How to Write a Thesis", "The Open Work", "Kant and the Platypus" },
                { "Don Quixote: Volume I", "Don Quixote: Volume II", "Exemplary Novels", "The Trials of Persiles and Sigismunda", "Journey to Parnassus", "La Galatea", "The Siege of Numantia", "The Ruffian Widow", "The Wonder Show", "The Dialogue of the Dogs" },
                { "The Girl with the Dragon Tattoo", "The Girl Who Played with Fire", "The Girl Who Kicked the Hornet's Nest", "Millennium Legacy", "The Shadow Network", "The Midnight Syndicate", "Echoes of Stockholm", "The Nordic Cipher", "Vengeance Code", "The Silent Witness" },
                { "The Snowman", "The Bat", "The Redbreast", "Nemesis", "The Devil's Star", "The Redeemer", "The Leopard", "Phantom", "Police", "The Thirst" },
                { "Solaris", "The Cyberiad", "His Master's Voice", "Fiasco", "The Invincible", "Tales of Pirx the Pilot", "Memoirs Found in a Bathtub", "Return from the Stars", "Eden", "Hospital of the Transfiguration" }
        };

        // Thematic title prefixes & suffixes for generating realistic books up to 1,200
        String[] titlePrefixes = {
                "The Chronicles of", "Echoes of", "Whispers in", "The Mystery of", "Song of",
                "Beyond the", "The Last", "Shadows over", "A Tale of", "The Secret of",
                "Rise of the", "Voyage to", "The Lost", "Portraits of", "The Architecture of",
                "Reflections on", "Fragments of", "Letters from", "The Paradox of", "Visions of",
                "The Book of", "In Search of", "A Journey through", "The Art of"
        };

        String[] titleSubjects = {
                "Eternity", "the Cosmos", "the Forgotten Kingdom", "Silence", "Darkness",
                "the Red Sun", "Avalon", "the Northern Wind", "Midsummer", "the Infinite Void",
                "Autumn Skies", "Obsidian Dreams", "the Hidden Valley", "the Cybernetic City",
                "Starlight", "the Quantum Horizon", "the Golden Mirage", "Solitude",
                "Winter Frost", "the Silver Thread", "Nebula IX", "the Ancient Gate",
                "the Velvet Realm", "Dawn"
        };

        Random random = new Random(42);
        List<Book> books = new ArrayList<>();
        int targetTotalBooks = 1200;
        int booksPerAuthor = targetTotalBooks / authors.size(); // 1200 / 50 = 24 books per author

        for (int aIdx = 0; aIdx < authors.size(); aIdx++) {
            Author author = authors.get(aIdx);
            String[] famous = (aIdx < famousWorks.length) ? famousWorks[aIdx] : new String[0];

            for (int bIdx = 0; bIdx < booksPerAuthor; bIdx++) {
                String title;
                if (bIdx < famous.length) {
                    title = famous[bIdx];
                } else {
                    int pIdx = (aIdx * 3 + bIdx * 5) % titlePrefixes.length;
                    int sIdx = (aIdx * 7 + bIdx * 11) % titleSubjects.length;
                    int volumeNum = (bIdx - famous.length + 1);
                    title = titlePrefixes[pIdx] + " " + titleSubjects[sIdx] + (volumeNum > 1 ? " (Vol. " + volumeNum + ")" : "");
                }

                String genre = genrePool[(aIdx * 2 + bIdx) % genrePool.length];
                int year = 1880 + (aIdx * 5 + bIdx * 7) % 145; // 1880 to 2024
                int month = 1 + (bIdx % 12);
                int day = 1 + ((bIdx * 3 + aIdx) % 28);
                double price = priceTiers[(aIdx + bIdx * 2) % priceTiers.length];
                int popularity = 100 + random.nextInt(900); // 100 to 999

                Book book = new Book();
                book.setTitle(title);
                book.setGenre(genre);
                book.setPublishedDate(LocalDate.of(year, month, day));
                book.setPublishYear(year);
                book.setPrice(price);
                book.setPopularity(popularity);
                book.setAuthor(author);
                books.add(book);
            }
        }

        // Batch save all 1,200 books
        bookRepository.saveAll(books);

        System.out.println(">>> Successfully seeded " + authors.size() + " authors and " + books.size() + " books.");
    }
}
