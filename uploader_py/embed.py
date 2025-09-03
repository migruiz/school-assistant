import os
import time
from pathlib import Path
from typing import List
from dotenv import load_dotenv

import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection


from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

class DocumentProcessor:
    def __init__(self, folder_to_embed: str):
        self.folder_to_embed = folder_to_embed
        
        # Initialize ChromaDB client
        self.client =  chromadb.CloudClient(
            api_key=os.getenv("CHROMA_API_KEY"),
            tenant=os.getenv("CHROMA_TENANT"),
            database=os.getenv("CHROMA_DATABASE")
        )
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            separators=["\n"],
            chunk_size=800,
            chunk_overlap=400
        )

    def load_and_chunk(self, file_path: str) -> List[Document]:
        """Load a file and chunk it into documents"""
        file_path = Path(file_path)
        
        # Choose appropriate loader based on file extension
        if file_path.suffix.lower() == '.pdf':
            loader = PyPDFLoader(str(file_path))
        elif file_path.suffix.lower() == '.docx':
            loader = Docx2txtLoader(str(file_path))
        elif file_path.suffix.lower() == '.txt':
            loader = TextLoader(str(file_path), encoding='utf-8')
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")
        
        # Load and extract text into documents
        docs = loader.load()
        
        # Chunk documents
        chunked_docs = self.text_splitter.split_documents(docs)
        return chunked_docs

    def get_new_id(self, file_name: str, chunk_id: int) -> str:
        """Generate a unique ID for each chunk"""
        timestamp = int(time.time() * 1000)  # milliseconds
        return f"{file_name}-{chunk_id}-{timestamp}"

    async def process_folder(self):
        """Main processing function"""
        folder_path = Path(self.folder_to_embed)
        
        # Get all subdirectories
        folders = [f for f in folder_path.iterdir() if f.is_dir()]
        
        for folder in folders:
            print(f"Processing folder: {folder.name}")
            
            # Get all files in the folder (non-directories only)
            files = [f for f in folder.iterdir() if f.is_file()]
            
            # Create or get collection
            try:
                collection = self.client.get_or_create_collection(name=folder.name)
                print(f"Created/accessed collection: {folder.name}")
            except Exception as e:
                print(f"Error creating collection {folder.name}: {e}")
                continue
            
            for file in files:
                print(f"Processing file: {file.name}")
                
                try:
                    # Load and chunk the file
                    chunks = self.load_and_chunk(str(file))
                    
                    # Process each chunk
                    for chunk_index, chunk in enumerate(chunks):
                        chunk_id = chunk_index + 1
                        text = chunk.page_content
                        
                        # Generate embedding
                        embedding = self.embeddings.embed_query(text)
                        
                        # Generate unique ID
                        doc_id = self.get_new_id(file.name, chunk_id)
                        
                        # Add to collection
                        collection.add(
                            ids=[doc_id],
                            embeddings=[embedding],
                            documents=[text],
                            metadatas=[{"fileName": file.name}]
                        )
                        
                        print(f"Added chunk {chunk_id} from {file.name}")
                        
                except Exception as e:
                    print(f"Error processing file {file.name}: {e}")
                    continue
            
            print(f"Completed processing folder: {folder.name}")

    def process_folder_sync(self):
        """Synchronous version of the main processing function"""
        folder_path = Path(self.folder_to_embed)
        
        # Get all subdirectories
        folders = [f for f in folder_path.iterdir() if f.is_dir()]
        
        for folder in folders:
            print(f"Processing folder: {folder.name}")
            
            # Get all files in the folder (non-directories only)
            files = [f for f in folder.iterdir() if f.is_file()]
            
            # Create or get collection
            try:
                collection = self.client.get_or_create_collection(name=folder.name)
                print(f"Created/accessed collection: {folder.name}")
            except Exception as e:
                print(f"Error creating collection {folder.name}: {e}")
                continue
            
            for file in files:
                print(f"Processing file: {file.name}")
                
                try:
                    # Load and chunk the file
                    chunks = self.load_and_chunk(str(file))
                    
                    # Process each chunk
                    for chunk_index, chunk in enumerate(chunks):
                        chunk_id = chunk_index + 1
                        text = chunk.page_content
                        
                        # Generate embedding
                        embedding = self.embeddings.embed_query(text)
                        
                        # Generate unique ID
                        doc_id = self.get_new_id(file.name, chunk_id)
                        
                        # Add to collection
                        collection.add(
                            ids=[doc_id],
                            embeddings=[embedding],
                            documents=[text],
                            metadatas=[{"fileName": file.name}]
                        )
                        
                        print(f"Added chunk {chunk_id} from {file.name}")
                        
                except Exception as e:
                    print(f"Error processing file {file.name}: {e}")
                    continue
            
            print(f"Completed processing folder: {folder.name}")


def main():
    # Set your folder path here
    folder_to_embed = r"C:\\repos\\retns\\static"
    
    # Create processor instance
    processor = DocumentProcessor(folder_to_embed)
    
    # Run the processing (synchronous version)
    processor.process_folder_sync()
    
    print("Processing completed!")


if __name__ == "__main__":
    main()